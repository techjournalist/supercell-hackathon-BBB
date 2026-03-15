import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { AudioManager } from './AudioManager.js';
import { soundEffects } from './SoundEffectsManager.js';
import * as Tone from 'tone';

export class Unit extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config, isEnemy = false, factionId = 'roman') {
    super(scene, x, y);
    
    this.scene = scene;
    this.config = config;
    this.isEnemy = isEnemy;
    this.factionId = factionId;
    
    // Stats
    this.maxHealth = config.health;
    this.health = this.maxHealth;
    this.damage = config.damage;
    this.attackRange = config.attackRange;
    this.attackSpeed = config.attackSpeed;
    this.speed = config.speed;
    
    // State
    this.target = null;
    this.lastAttackTime = 0;
    this.isDead = false;
    this.isAttacking = false;
    
    // Create sprite
    const spriteKey = this.getSpriteKey();
    this.sprite = scene.add.sprite(0, 0, spriteKey);
    this.sprite.setScale(0.15);  // Start with base scale
    
    // Set facing based on team
    // Player units (from left base) walk RIGHT -> face RIGHT (positive scaleX)
    // Enemy units (from right base) walk LEFT -> face LEFT (negative scaleX)
    this.updateFacing();
    
    // Health bar background
    this.healthBarBg = scene.add.rectangle(0, -60, 60, 8, CONFIG.COLORS.healthBarBg);
    
    // Health bar
    this.healthBar = scene.add.rectangle(0, -60, 60, 8, 
      isEnemy ? CONFIG.COLORS.enemyHealth : CONFIG.COLORS.playerHealth);
    
    this.add([this.sprite, this.healthBarBg, this.healthBar]);
    
    scene.add.existing(this);
    this.setDepth(12); // Above bases (10), mines (8), ground (2), but below UI (100+)
    
    // Animation state
    this.walkPhase = Math.random() * Math.PI * 2; // Random start phase for variety
    this.idlePhase = Math.random() * Math.PI * 2;
    this._lastAuraCheck = 0;

    // Start idle bobbing animation
    this.startIdleAnimation();
  }
  
  startIdleAnimation() {
    // Gentle bobbing animation when not moving
    if (this.idleTween) this.idleTween.stop();
    
    this.idleTween = this.scene.tweens.add({
      targets: this.sprite,
      y: '+=3',
      duration: 1000 + Math.random() * 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  startWalkAnimation() {
    // Stop idle animation when walking
    if (this.idleTween) {
      this.idleTween.stop();
      this.sprite.y = 0; // Reset position
    }
  }
  
  stopWalkAnimation() {
    // Return to idle animation when stopping
    this.sprite.y = 0;
    this.startIdleAnimation();
  }
  
  getSpriteKey() {
    // Check if worker first
    if (this.config.name === 'Worker') return 'worker';
    if (this.config.name === 'Harvester') return 'harvester';
    if (this.config.name === 'Thrall') return 'thrall';
    
    // Scout - different sprite for each faction
    if (this.config.name === 'Scout') {
      return this.isEnemy ? 'alien-scout' : 'scout';
    }
    
    // Roman units (player units)
    if (this.config.name === 'Legionary') return 'legionary';
    if (this.config.name === 'Pilum Thrower') return 'pilum';
    if (this.config.name === 'Centurion') return 'centurion';
    
    // Alien units (enemy units)
    if (this.config.name === 'Drone') return 'drone';
    if (this.config.name === 'Blaster') return 'blaster';
    if (this.config.name === 'Overlord') return 'overlord';
    
    // Viking units
    if (this.config.name === 'Berserker') return 'berserker';
    if (this.config.name === 'Axe Thrower') return 'axeThrower';
    if (this.config.name === 'Jarl') return 'jarl';
    
    // Legacy units (if any remain)
    if (this.isEnemy) {
      if (this.config.name === 'Warrior') return 'enemy-warrior';
      if (this.config.name === 'Enemy Archer') return 'archer';
    } else {
      if (this.config.name === 'Knight') return 'knight';
      if (this.config.name === 'Archer') return 'archer';
    }
    return 'legionary';
  }
  
  updateFacing() {
    // CRITICAL: Sprite facing MUST match movement direction
    // NOTE: Player sprites (Roman) are drawn facing LEFT, Alien sprites are drawn facing RIGHT
    // EXCEPTION: Overlord is drawn facing LEFT (like Roman units)
    // Player units: spawn at x=250 (LEFT), move RIGHT (+velocity), face RIGHT (NEGATIVE scaleX to flip left→right)
    // Enemy units: spawn at x=5550 (RIGHT), move LEFT (-velocity), face LEFT (NEGATIVE scaleX to flip right→left)
    // Overlord exception: spawn at x=5550 (RIGHT), move LEFT (-velocity), face LEFT (POSITIVE scaleX, already left)
    if (this.isEnemy) {
      // Special case for Overlord - it's drawn facing LEFT like Roman units
      if (this.config.name === 'Overlord') {
        // Enemy Overlord from RIGHT base → walks LEFT ⬅️ → faces LEFT (positive scaleX = default left facing)
        this.sprite.setScale(0.15, 0.15);
      } else {
        // Other enemy units from RIGHT base → walks LEFT ⬅️ → faces LEFT (negative scaleX = flip right to left)
        this.sprite.setScale(-0.15, 0.15);
      }
    } else {
      // Player from LEFT base → walks RIGHT ➡️ → faces RIGHT (negative scaleX = flip left to right)
      this.sprite.setScale(-0.15, 0.15);
    }
  }
  
  applyAuraEffects() {
    const friendlies = this.isEnemy ? this.scene.enemyUnits : this.scene.playerUnits;
    let bestBonus = 0;

    friendlies.forEach(unit => {
      if (unit === this || unit.isDead || !unit.config.auraRadius) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
      if (dist <= unit.config.auraRadius) {
        bestBonus = Math.max(bestBonus, unit.config.auraBonus || 0);
      }
    });

    this.auraBoostActive = bestBonus > 0;
    this.auraBoostAmount = bestBonus;
  }

  update(time, delta) {
    if (this.isDead) return;

    // Apply aura bonuses at most every 200ms (O(n²) cost mitigation)
    if (time - this._lastAuraCheck >= 200) {
      this._lastAuraCheck = time;
      this.applyAuraEffects();
    }

    // Check for targets
    const enemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;
    const enemyBase = this.isEnemy ? this.scene.playerBase : this.scene.enemyBase;
    const enemyMine = this.isEnemy ? this.scene.playerMine : this.scene.enemyMine;
    
    // Find closest target
    let closestTarget = null;
    let closestDist = Infinity;
    
    // PRIORITY 1: Check enemy units first (defend against threats)
    enemies.forEach(enemy => {
      if (enemy.isDead || enemy.isWorker) return;  // Ignore workers
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = enemy;
      }
    });
    
    // PRIORITY 2: Check enemy mine (strategic target - destroy economy first)
    if (enemyMine && !enemyMine.isDead) {
      const mineDist = Phaser.Math.Distance.Between(this.x, this.y, enemyMine.x, enemyMine.y);
      if (mineDist < closestDist) {
        closestDist = mineDist;
        closestTarget = enemyMine;
      }
    }
    
    // PRIORITY 3: Check enemy base (final target after mine is destroyed)
    const baseDist = Phaser.Math.Distance.Between(this.x, this.y, enemyBase.x, enemyBase.y);
    if (baseDist < closestDist) {
      closestDist = baseDist;
      closestTarget = enemyBase;
    }
    
    this.target = closestTarget;
    
    // If target in range, STOP and attack
    if (this.target && closestDist <= this.attackRange) {
      // Stop moving, attack
      if (time - this.lastAttackTime >= this.attackSpeed && !this.isAttacking) {
        this.attack();
        this.lastAttackTime = time;
      }
    } else {
      // Check if this is a player scout with exploration AI enabled
      if (!this.isEnemy && this.config.name === 'Scout' && this.scene.explorationAIEnabled) {
        this.exploreUnknownAreas(time, delta);
      } 
      // Check if this is an AI scout (enemy scout)
      else if (this.isEnemy && this.isAIScout) {
        this.aiScoutBehavior(time, delta);
      } 
      else if (!this.isEnemy && this._rallyTarget) {
        // Move toward rally point first before engaging
        const dx = this._rallyTarget.x - this.x;
        const dist = Math.abs(dx);
        if (dist > 80) {
          const dir = Math.sign(dx);
          this.x += dir * this.speed * (delta / 1000);
        } else {
          this._rallyTarget = null;
        }
      } else {
        // Move toward enemy side
        // Player units (from LEFT base x=100) move RIGHT: direction = +1 (velocity is POSITIVE)
        // Enemy units (from RIGHT base x=5700) move LEFT: direction = -1 (velocity is NEGATIVE)
        const direction = this.isEnemy ? -1 : 1;
        this.x += direction * this.speed * (delta / 1000);
        // Player: x += (+1) * speed → x increases → walks RIGHT ➡️
        // Enemy: x += (-1) * speed → x decreases → walks LEFT ⬅️
        
        // Bouncy walk cycle - units bob up and down while moving
        const oldWalkPhase = this.walkPhase || 0;
        this.walkPhase = (this.walkPhase || 0) + (delta / 1000) * this.speed * 0.05;
        const bounceAmount = Math.sin(this.walkPhase) * 5;
        this.sprite.y = bounceAmount;
        
        // Play footstep sound on each step (when walk phase crosses PI intervals)
        const oldStep = Math.floor(oldWalkPhase / Math.PI);
        const newStep = Math.floor(this.walkPhase / Math.PI);
        if (oldStep !== newStep) {
          soundEffects.playFootstep(this.factionId);
        }
        
        // Slight squash and stretch on footfalls
        const squashAmount = 1 + Math.sin(this.walkPhase) * 0.02;
        const currentScaleX = this.sprite.scaleX;
        const scaleSign = Math.sign(currentScaleX);
        this.sprite.setScale(scaleSign * 0.15 * squashAmount, 0.15 / squashAmount)
      }
    }
  }
  
  exploreUnknownAreas(time, delta) {
    // Exploration AI for scouts
    // Move towards unexplored fog areas
    
    // Check if we need a new exploration target
    if (!this.explorationTarget || this.hasReachedTarget()) {
      this.explorationTarget = this.findUnexploredArea();
    }
    
    if (this.explorationTarget) {
      // Move toward exploration target
      const dx = this.explorationTarget.x - this.x;
      const dy = this.explorationTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 20) {
        // Normalize and move
        const moveX = (dx / distance) * this.speed * (delta / 1000);
        const moveY = (dy / distance) * this.speed * (delta / 1000);
        this.x += moveX;
        this.y += moveY;
      } else {
        // Reached target, find new one
        this.explorationTarget = null;
      }
    } else {
      // No unexplored areas found, patrol between key points
      this.patrolBehavior(time, delta);
    }
  }
  
  hasReachedTarget() {
    // Check exploration target
    if (this.explorationTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.explorationTarget.x, this.explorationTarget.y
      );
      return dist < 50;
    }
    
    // Check monitor target (for AI scouts)
    if (this.monitorTarget) {
      const dist = Phaser.Math.Distance.Between(
        this.x, this.y,
        this.monitorTarget.x, this.monitorTarget.y
      );
      return dist < 50;
    }
    
    return true;
  }
  
  findUnexploredArea() {
    // Sample points across the map and find the least explored area
    const samplePoints = [];
    const worldWidth = CONFIG.WORLD_WIDTH;
    const worldHeight = this.scene.scale.height;
    const sampleSize = 10; // Check 10 random points
    
    for (let i = 0; i < sampleSize; i++) {
      const x = Math.random() * worldWidth;
      const y = this.scene.groundY - 40 + (Math.random() - 0.5) * 100; // Near ground level with some variance
      
      // Check if this area is currently visible
      const isVisible = this.scene.isInPlayerVision(x, y);
      
      if (!isVisible) {
        samplePoints.push({ x, y, score: this.calculateExplorationScore(x, y) });
      }
    }
    
    // Sort by score (higher is better)
    samplePoints.sort((a, b) => b.score - a.score);
    
    // Return best unexplored point
    return samplePoints.length > 0 ? samplePoints[0] : null;
  }
  
  calculateExplorationScore(x, y) {
    // Score based on:
    // 1. Distance from current position (prefer closer targets)
    // 2. Distance from player base (prefer exploring forward)
    // 3. Near enemy base gets higher priority
    
    const distFromSelf = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    const distFromPlayerBase = Math.abs(x - CONFIG.PLAYER_BASE_X);
    const distFromEnemyBase = Math.abs(x - CONFIG.ENEMY_BASE_X);
    
    let score = 0;
    
    // Prefer areas not too far away (within 1000 units)
    if (distFromSelf < 1000) {
      score += (1000 - distFromSelf) / 10;
    }
    
    // Prefer exploring forward (toward enemy)
    score += distFromPlayerBase / 100;
    
    // Higher priority for areas near enemy base
    if (distFromEnemyBase < 1500) {
      score += (1500 - distFromEnemyBase) / 50;
    }
    
    return score;
  }
  
  patrolBehavior(time, delta) {
    // Patrol between forward and mid positions when no unexplored areas
    if (!this.patrolTarget) {
      // Choose a patrol point between middle and enemy base
      const midPoint = CONFIG.WORLD_WIDTH / 2;
      const targetX = midPoint + (Math.random() - 0.5) * 1000;
      this.patrolTarget = { x: targetX, y: this.scene.groundY - 40 };
    }
    
    const dx = this.patrolTarget.x - this.x;
    const distance = Math.abs(dx);
    
    if (distance > 20) {
      const direction = dx > 0 ? 1 : -1;
      this.x += direction * this.speed * (delta / 1000);
    } else {
      // Reached patrol point, pick new one
      this.patrolTarget = null;
    }
  }
  
  aiScoutBehavior(time, delta) {
    // AI scout behavior: Search for player base and monitor unit movements
    
    // Phase 1: Explore - Move towards player base area
    if (this.scoutingPhase === 'explore') {
      // Target player base area (left side of map)
      const targetX = CONFIG.PLAYER_BASE_X + 400; // Stay near player base
      const targetY = this.scene.groundY - 40;
      
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 100) {
        // Move toward player base area
        const moveX = (dx / distance) * this.speed * (delta / 1000);
        const moveY = (dy / distance) * this.speed * (delta / 1000);
        this.x += moveX;
        this.y += moveY;
      } else {
        // Reached player area, switch to monitoring
        this.scoutingPhase = 'monitor';
      }
    }
    
    // Phase 2: Monitor - Observe player units and relay info
    if (this.scoutingPhase === 'monitor') {
      // Check if being chased before reporting
      const beingChased = this.scene.playerUnits.some(u => {
        if (u.isDead) return false;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, u.x, u.y);
        return dist < 200 && u.target === this;
      });
      
      // Report player unit positions every 3 seconds (if safe)
      if (!beingChased && time - this.lastScoutReport >= 3000) {
        this.reportEnemyPositions();
        this.lastScoutReport = time;
      }
      
      // Move around player base area to maintain vision
      if (!this.monitorTarget || this.hasReachedTarget()) {
        // Pick a random point near player base to patrol
        const patrolRadius = 600;
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * patrolRadius;
        
        this.monitorTarget = {
          x: CONFIG.PLAYER_BASE_X + Math.cos(angle) * dist,
          y: this.scene.groundY - 40 + (Math.random() - 0.5) * 100
        };
      }
      
      if (this.monitorTarget) {
        const dx = this.monitorTarget.x - this.x;
        const dy = this.monitorTarget.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 50) {
          const moveX = (dx / distance) * this.speed * (delta / 1000);
          const moveY = (dy / distance) * this.speed * (delta / 1000);
          this.x += moveX;
          this.y += moveY;
        } else {
          this.monitorTarget = null;
        }
      }
      
      // If under heavy attack, retreat back to explore phase
      const nearbyEnemies = this.scene.playerUnits.filter(u => {
        if (u.isDead) return false;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, u.x, u.y);
        return dist < 300;
      });
      
      if (nearbyEnemies.length >= 4 && this.health < this.maxHealth * 0.5) {
        // Retreat to safety
        this.scoutingPhase = 'retreat';
        this.retreatTarget = { x: CONFIG.ENEMY_BASE_X - 400, y: this.scene.groundY - 40 };
      }
    }
    
    // Phase 3: Retreat - Return to safety
    if (this.scoutingPhase === 'retreat') {
      const dx = this.retreatTarget.x - this.x;
      const dy = this.retreatTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 100) {
        const moveX = (dx / distance) * this.speed * (delta / 1000);
        const moveY = (dy / distance) * this.speed * (delta / 1000);
        this.x += moveX;
        this.y += moveY;
      } else {
        // Reached safety, resume exploration
        this.scoutingPhase = 'explore';
      }
    }
  }
  
  reportEnemyPositions() {
    // Report spotted player units back to AI
    const scoutedUnits = [];
    
    // Find all player units within scout's enhanced vision range
    const visionRange = 245 * (this.config.visionMultiplier || 1);
    
    this.scene.playerUnits.forEach(unit => {
      if (unit.isDead) return;
      
      const dist = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
      if (dist <= visionRange) {
        scoutedUnits.push({
          x: unit.x,
          y: unit.y,
          type: unit.config.name,
          hp: unit.health,
          timestamp: Date.now()
        });
      }
    });
    
    // Update AI's knowledge of player positions
    if (scoutedUnits.length > 0) {
      this.scene.aiScoutTargets = scoutedUnits;
      
      // Visual feedback - small pulse effect on scout
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.5,
        duration: 150,
        yoyo: true,
        repeat: 1
      });
      
      // Show warning indicator to player if units are spotted
      this.showScoutWarning();
    }
  }
  
  showScoutWarning() {
    // Create a brief warning icon above the scout
    const warningIcon = this.scene.add.text(this.x, this.y - 80, '⚠️', {
      fontSize: '24px'
    });
    warningIcon.setDepth(600);
    
    // Animate and fade out
    this.scene.tweens.add({
      targets: warningIcon,
      y: this.y - 120,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => warningIcon.destroy()
    });
    
    // Show notification to player (throttled to avoid spam)
    if (!this.scene.lastScoutWarningTime || Date.now() - this.scene.lastScoutWarningTime > 10000) {
      this.scene.showScoutDetectedNotification();
      this.scene.lastScoutWarningTime = Date.now();
    }
  }
  
  getEffectiveDamage() {
    let dmg = this.damage;

    // Berserker rage: +damage when below threshold HP
    if (this.config.berserkerThreshold && this.health / this.maxHealth < this.config.berserkerThreshold) {
      dmg = Math.floor(dmg * (1 + (this.config.berserkerBonus || 0.25)));
      if (!this.berserkerVisual) {
        this.berserkerVisual = this.scene.add.circle(0, 0, 28, 0xFF3300, 0.25);
        this.add(this.berserkerVisual);
        this.scene.tweens.add({
          targets: this.berserkerVisual,
          alpha: 0.45,
          scale: 1.15,
          duration: 350,
          yoyo: true,
          repeat: -1,
        });
      }
    } else if (this.berserkerVisual) {
      this.berserkerVisual.destroy();
      this.berserkerVisual = null;
    }

    // Aura damage bonus from nearby friendly heavy units
    if (this.auraBoostActive) {
      dmg = Math.floor(dmg * (1 + (this.auraBoostAmount || 0)));
    }

    return dmg;
  }

  calculateRangedDamage(baseDamage, distance) {
    const falloff = this.config.rangedDamageFalloff;
    if (!falloff || this.attackRange <= 100) return baseDamage;

    const pct = Math.min(1, distance / this.attackRange);
    const rangeFalloff = 1 - (1 - falloff) * pct;
    return Math.max(1, Math.floor(baseDamage * rangeFalloff));
  }

  isRangedUnit() {
    return this.attackRange > 100;
  }

  getProjectileType() {
    if (this.config.name === 'Axe Thrower') return 'axe';
    if (this.factionId === 'alien' && this.isRangedUnit()) return 'laser';
    if (this.config.name === 'Pilum Thrower') return 'pilum';
    if (this.config.name === 'Tower') return 'pilum';
    return 'pilum';
  }

  fireProjectile(targetX, targetY) {
    const type = this.getProjectileType();
    const startX = this.x;
    const startY = this.y - 10;
    const dx = targetX - startX;
    const dy = targetY - startY;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    const travelDuration = 320;

    if (type === 'axe') {
      const axeHead = this.scene.add.rectangle(startX, startY, 18, 8, 0xC0C0C0);
      axeHead.setDepth(15);
      axeHead.rotation = angle * (Math.PI / 180);

      const axeHandle = this.scene.add.rectangle(startX, startY, 10, 3, 0x8B4513);
      axeHandle.setDepth(14);

      this.scene.tweens.add({
        targets: [axeHead, axeHandle],
        x: targetX,
        y: targetY,
        duration: travelDuration,
        ease: 'Linear',
        onUpdate: () => {
          axeHead.rotation += 0.22;
          axeHandle.x = axeHead.x;
          axeHandle.y = axeHead.y;
          axeHandle.rotation = axeHead.rotation + Math.PI / 2;
        },
        onComplete: () => {
          this.spawnImpactFlash(targetX, targetY, type);
          axeHead.destroy();
          axeHandle.destroy();
        }
      });

    } else if (type === 'laser') {
      const laserLen = 22;
      const bolt = this.scene.add.graphics();
      bolt.setDepth(15);
      bolt._angle = angle * Math.PI / 180;

      const drawBolt = (progress) => {
        bolt.clear();
        const cx = startX + dx * progress;
        const cy = startY + dy * progress;
        const glow = 0x00FF88;
        const core = 0xAAFFCC;
        const pulse = 0.7 + 0.3 * Math.sin(progress * Math.PI * 6);

        bolt.lineStyle(5, glow, 0.35 * pulse);
        bolt.beginPath();
        const bx = cx + Math.cos(bolt._angle) * laserLen * 0.5;
        const by = cy + Math.sin(bolt._angle) * laserLen * 0.5;
        const ex = cx - Math.cos(bolt._angle) * laserLen * 0.5;
        const ey = cy - Math.sin(bolt._angle) * laserLen * 0.5;
        bolt.moveTo(bx, by);
        bolt.lineTo(ex, ey);
        bolt.strokePath();

        bolt.lineStyle(2, core, 0.9 * pulse);
        bolt.beginPath();
        bolt.moveTo(bx, by);
        bolt.lineTo(ex, ey);
        bolt.strokePath();
      };

      drawBolt(0);

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: travelDuration,
        ease: 'Linear',
        onUpdate: (tween) => {
          drawBolt(tween.getValue());
        },
        onComplete: () => {
          this.spawnImpactFlash(targetX, targetY, type);
          bolt.destroy();
        }
      });

    } else {
      const pLen = 24;
      const pilum = this.scene.add.graphics();
      pilum.setDepth(15);
      const rad = angle * Math.PI / 180;

      const drawPilum = (cx, cy) => {
        pilum.clear();
        const tipX = cx + Math.cos(rad) * pLen * 0.5;
        const tipY = cy + Math.sin(rad) * pLen * 0.5;
        const tailX = cx - Math.cos(rad) * pLen * 0.5;
        const tailY = cy - Math.sin(rad) * pLen * 0.5;

        pilum.lineStyle(2, 0xD4A050, 0.9);
        pilum.beginPath();
        pilum.moveTo(tailX, tailY);
        pilum.lineTo(tipX - Math.cos(rad) * 8, tipY - Math.sin(rad) * 8);
        pilum.strokePath();

        pilum.lineStyle(2, 0xE8E8E8, 1);
        pilum.beginPath();
        pilum.moveTo(tipX - Math.cos(rad) * 8, tipY - Math.sin(rad) * 8);
        pilum.lineTo(tipX, tipY);
        pilum.strokePath();
      };

      drawPilum(startX, startY);

      this.scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: travelDuration,
        ease: 'Cubic.easeIn',
        onUpdate: (tween) => {
          const t = tween.getValue();
          const cx = startX + dx * t;
          const cy = startY + dy * t + Math.sin(t * Math.PI) * -12;
          drawPilum(cx, cy);
        },
        onComplete: () => {
          this.spawnImpactFlash(targetX, targetY, type);
          pilum.destroy();
        }
      });
    }
  }

  spawnImpactFlash(x, y, type) {
    if (type === 'axe') {
      const flash = this.scene.add.circle(x, y, 10, 0xCCCCCC, 0.7);
      flash.setDepth(16);
      for (let i = 0; i < 4; i++) {
        const spark = this.scene.add.rectangle(x, y, 8, 2, 0xFFFFFF, 0.9);
        spark.setDepth(16);
        spark.rotation = (i / 4) * Math.PI;
        this.scene.tweens.add({
          targets: spark,
          scaleX: 0.1,
          alpha: 0,
          duration: 200,
          ease: 'Power2',
          onComplete: () => spark.destroy()
        });
      }
      this.scene.tweens.add({
        targets: flash,
        scaleX: 2.2,
        scaleY: 2.2,
        alpha: 0,
        duration: 220,
        ease: 'Power2',
        onComplete: () => flash.destroy()
      });

    } else if (type === 'laser') {
      const ring = this.scene.add.circle(x, y, 6, 0x00FF88, 0);
      ring.setDepth(16);
      ring.setStrokeStyle(2, 0x00FF88, 0.9);
      const glow = this.scene.add.circle(x, y, 8, 0x00FF88, 0.5);
      glow.setDepth(15);
      this.scene.tweens.add({
        targets: ring,
        scaleX: 3,
        scaleY: 3,
        alpha: 0,
        duration: 280,
        ease: 'Power2',
        onComplete: () => ring.destroy()
      });
      this.scene.tweens.add({
        targets: glow,
        scaleX: 0.1,
        scaleY: 0.1,
        alpha: 0,
        duration: 180,
        ease: 'Power3',
        onComplete: () => glow.destroy()
      });

    } else {
      const spark = this.scene.add.circle(x, y, 6, 0xFF9900, 0.9);
      spark.setDepth(16);
      this.scene.tweens.add({
        targets: spark,
        scaleX: 2.5,
        scaleY: 2.5,
        alpha: 0,
        duration: 200,
        ease: 'Power2',
        onComplete: () => spark.destroy()
      });
    }
  }

  getMeleeWeaponType() {
    const name = this.config.name;
    if (this.factionId === 'viking') {
      if (name === 'Berserker' || name === 'Jarl') return 'viking_heavy';
      return 'viking_light';
    }
    if (this.factionId === 'alien') return 'alien_claw';
    return 'roman_sword';
  }

  spawnMeleeSlash(targetX, targetY) {
    const weaponType = this.getMeleeWeaponType();
    const swingDir = this.isEnemy ? -1 : 1;

    if (weaponType === 'roman_sword') {
      this.spawnSwordSlash(swingDir);
    } else if (weaponType === 'viking_heavy') {
      this.spawnAxeSmash(swingDir, true);
    } else if (weaponType === 'viking_light') {
      this.spawnAxeSmash(swingDir, false);
    } else if (weaponType === 'alien_claw') {
      this.spawnClawSwipe(targetX, targetY);
    }
  }

  spawnSwordSlash(swingDir) {
    const gfx = this.scene.add.graphics();
    gfx.setDepth(20);

    const cx = this.x + swingDir * 20;
    const cy = this.y - 10;
    const radius = 32;
    const startAngle = swingDir === 1
      ? Phaser.Math.DegToRad(-60)
      : Phaser.Math.DegToRad(120);
    const endAngle = swingDir === 1
      ? Phaser.Math.DegToRad(60)
      : Phaser.Math.DegToRad(240);

    const drawSlash = (progress) => {
      gfx.clear();
      const alpha = (1 - progress) * 0.85;

      gfx.lineStyle(5, 0xFFFFFF, alpha * 0.4);
      gfx.beginPath();
      gfx.arc(cx, cy, radius + 4, startAngle, startAngle + (endAngle - startAngle) * progress, false);
      gfx.strokePath();

      gfx.lineStyle(2.5, 0xE8E8FF, alpha);
      gfx.beginPath();
      gfx.arc(cx, cy, radius, startAngle, startAngle + (endAngle - startAngle) * progress, false);
      gfx.strokePath();

      gfx.lineStyle(1, 0xFFFFFF, alpha * 0.6);
      gfx.beginPath();
      gfx.arc(cx, cy, radius - 5, startAngle, startAngle + (endAngle - startAngle) * progress, false);
      gfx.strokePath();

      if (progress > 0.3) {
        const tipAngle = startAngle + (endAngle - startAngle) * progress;
        const tipX = cx + Math.cos(tipAngle) * radius;
        const tipY = cy + Math.sin(tipAngle) * radius;
        gfx.fillStyle(0xFFFFFF, alpha * 0.9);
        gfx.fillCircle(tipX, tipY, 3);
      }
    };

    this.scene.tweens.addCounter({
      from: 0, to: 1,
      duration: 200,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => drawSlash(tween.getValue()),
      onComplete: () => gfx.destroy()
    });

    const trailLine = this.scene.add.graphics();
    trailLine.setDepth(19);
    this.scene.time.delayedCall(60, () => {
      const trailAngle = startAngle + (endAngle - startAngle) * 0.4;
      const tx1 = cx + Math.cos(trailAngle) * (radius - 8);
      const ty1 = cy + Math.sin(trailAngle) * (radius - 8);
      const tx2 = cx + Math.cos(trailAngle) * (radius + 8);
      const ty2 = cy + Math.sin(trailAngle) * (radius + 8);
      trailLine.lineStyle(1.5, 0xCCCCFF, 0.5);
      trailLine.beginPath();
      trailLine.moveTo(tx1, ty1);
      trailLine.lineTo(tx2, ty2);
      trailLine.strokePath();
      this.scene.tweens.add({
        targets: trailLine,
        alpha: 0,
        duration: 120,
        onComplete: () => trailLine.destroy()
      });
    });
  }

  spawnAxeSmash(swingDir, heavy) {
    const gfx = this.scene.add.graphics();
    gfx.setDepth(20);

    const cx = this.x + swingDir * 18;
    const cy = this.y - 5;
    const radius = heavy ? 42 : 30;
    const outerColor = heavy ? 0xFF6600 : 0xFF8C00;
    const innerColor = heavy ? 0xFFDD00 : 0xFFAA00;
    const arcSpan = heavy ? Phaser.Math.DegToRad(90) : Phaser.Math.DegToRad(70);
    const startAngle = swingDir === 1
      ? Phaser.Math.DegToRad(-80)
      : Phaser.Math.DegToRad(100);
    const endAngle = startAngle + arcSpan;

    const drawSmash = (progress) => {
      gfx.clear();
      const alpha = (1 - progress) * 0.9;
      const thicknessOuter = heavy ? 7 : 5;
      const thicknessInner = heavy ? 3.5 : 2.5;

      gfx.lineStyle(thicknessOuter, outerColor, alpha * 0.5);
      gfx.beginPath();
      gfx.arc(cx, cy, radius + 5, startAngle, startAngle + (endAngle - startAngle) * progress, false);
      gfx.strokePath();

      gfx.lineStyle(thicknessInner, innerColor, alpha);
      gfx.beginPath();
      gfx.arc(cx, cy, radius, startAngle, startAngle + (endAngle - startAngle) * progress, false);
      gfx.strokePath();

      if (progress > 0.5) {
        const impactAngle = startAngle + (endAngle - startAngle) * progress;
        const impX = cx + Math.cos(impactAngle) * radius;
        const impY = cy + Math.sin(impactAngle) * radius;
        const sparkAlpha = (1 - progress) * alpha * 1.5;
        for (let i = 0; i < (heavy ? 3 : 2); i++) {
          const sAngle = impactAngle + (i - 1) * Phaser.Math.DegToRad(25);
          const sLen = heavy ? 14 : 10;
          gfx.lineStyle(1.5, 0xFFFFAA, sparkAlpha);
          gfx.beginPath();
          gfx.moveTo(impX, impY);
          gfx.lineTo(impX + Math.cos(sAngle) * sLen, impY + Math.sin(sAngle) * sLen);
          gfx.strokePath();
        }
      }
    };

    const duration = heavy ? 220 : 170;
    this.scene.tweens.addCounter({
      from: 0, to: 1,
      duration,
      ease: 'Cubic.easeOut',
      onUpdate: (tween) => drawSmash(tween.getValue()),
      onComplete: () => gfx.destroy()
    });

    if (heavy) {
      const dustX = this.x + swingDir * 36;
      const dustY = this.y + 10;
      for (let i = 0; i < 4; i++) {
        const dust = this.scene.add.circle(
          dustX + Phaser.Math.Between(-8, 8),
          dustY,
          Phaser.Math.Between(4, 8),
          0xBB8844,
          0.55
        );
        dust.setDepth(18);
        this.scene.tweens.add({
          targets: dust,
          x: dust.x + swingDir * Phaser.Math.Between(10, 22),
          y: dust.y - Phaser.Math.Between(8, 18),
          alpha: 0,
          scaleX: 2,
          scaleY: 2,
          duration: 280,
          ease: 'Power2',
          delay: i * 30,
          onComplete: () => dust.destroy()
        });
      }

      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(50, 0.0025);
      }
    }
  }

  spawnClawSwipe(targetX, targetY) {
    const swingDir = this.isEnemy ? -1 : 1;
    const cx = this.x + swingDir * 16;
    const cy = this.y - 8;
    const clawLen = 34;
    const baseAngle = swingDir === 1 ? 0 : Math.PI;

    const clawOffsets = [-Phaser.Math.DegToRad(22), 0, Phaser.Math.DegToRad(22)];
    const clawColors = [0x00FF88, 0x44FFAA, 0x00FF88];
    const clawWidths = [1.5, 2.5, 1.5];
    const graphics = [];

    clawOffsets.forEach((offset, i) => {
      const gfx = this.scene.add.graphics();
      gfx.setDepth(20);
      graphics.push(gfx);

      const angle = baseAngle + offset;
      const ex = cx + Math.cos(angle) * clawLen;
      const ey = cy + Math.sin(angle) * clawLen;

      const drawClaw = (progress) => {
        gfx.clear();
        const alpha = progress < 0.7 ? progress / 0.7 : (1 - progress) / 0.3;
        gfx.lineStyle(clawWidths[i] + 3, 0x004422, alpha * 0.25);
        gfx.beginPath();
        gfx.moveTo(cx, cy);
        gfx.lineTo(cx + (ex - cx) * Math.min(1, progress * 1.4), cy + (ey - cy) * Math.min(1, progress * 1.4));
        gfx.strokePath();

        gfx.lineStyle(clawWidths[i], clawColors[i], alpha * 0.9);
        gfx.beginPath();
        gfx.moveTo(cx, cy);
        gfx.lineTo(cx + (ex - cx) * Math.min(1, progress * 1.4), cy + (ey - cy) * Math.min(1, progress * 1.4));
        gfx.strokePath();
      };

      this.scene.tweens.addCounter({
        from: 0, to: 1,
        duration: 200,
        ease: 'Cubic.easeOut',
        delay: i * 18,
        onUpdate: (tween) => drawClaw(tween.getValue()),
        onComplete: () => gfx.destroy()
      });
    });

    this.scene.time.delayedCall(160, () => {
      const splatterX = cx + swingDir * (clawLen * 0.8);
      const splatterY = cy;
      for (let i = 0; i < 3; i++) {
        const dot = this.scene.add.circle(
          splatterX + Phaser.Math.Between(-10, 10),
          splatterY + Phaser.Math.Between(-8, 8),
          Phaser.Math.Between(2, 4),
          0x00DD66,
          0.75
        );
        dot.setDepth(21);
        this.scene.tweens.add({
          targets: dot,
          x: dot.x + Phaser.Math.Between(-12, 12),
          y: dot.y + Phaser.Math.Between(4, 14),
          alpha: 0,
          duration: 250,
          ease: 'Power2',
          onComplete: () => dot.destroy()
        });
      }
    });
  }

  attack() {
    if (!this.target || this.target.isDead || this.isAttacking) return;

    this.isAttacking = true;

    const originalScaleX = this.sprite.scaleX;
    const originalScaleY = this.sprite.scaleY;
    const swingDirection = this.isEnemy ? -1 : 1;

    const distToTarget = this.target.x !== undefined
      ? Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y)
      : 0;

    const targetX = this.target.x ?? this.x;
    const targetY = (this.target.y ?? this.y) - 10;

    if (this.isRangedUnit()) {
      this.fireProjectile(targetX, targetY);
    } else {
      this.spawnMeleeSlash(targetX, targetY);
    }

    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: originalScaleX * 1.3,
      scaleY: originalScaleY * 1.2,
      x: this.sprite.x + (swingDirection * 10),
      duration: 150,
      yoyo: true,
      onYoyo: () => {
        if (this.target && !this.target.isDead) {
          const base = this.getEffectiveDamage();
          const final = this.calculateRangedDamage(base, distToTarget);
          this.target.takeDamage(final, this.x, this.y, this);
          this.playAttackSound();
        }
      },
      onComplete: () => {
        this.sprite.x = 0;
        this.isAttacking = false;
      }
    });
  }
  
  playAttackSound() {
    // Use SoundEffectsManager for attack sounds
    if (this.config.attackRange > 100) {
      // Ranged attack - laser/energy weapon
      if (this.factionId === 'alien') {
        soundEffects.playLaser('C5');
      } else {
        soundEffects.playLaser('E5');
      }
    } else {
      // Melee attack
      soundEffects.playMeleeAttack(this.factionId);
    }
  }
  
  takeDamage(amount, fromX, fromY, attacker) {
    if (this.isDead) return;

    let finalDamage = amount;

    // Apply existing damage reduction (shield, frost shield)
    if (this.shieldActive) {
      finalDamage *= 0.5;
    }
    if (this.damageReduction) {
      finalDamage *= (1 - this.damageReduction);
    }
    finalDamage = Math.max(1, finalDamage);

    // Frost Shield slow: chill the attacker
    if (this.frostSlowActive && attacker && !attacker.isDead && !attacker._frostSlowed) {
      const slowAmount = this.frostSlowAmount || 0.4;
      attacker._frostSlowed = true;
      const origSpeed = attacker.speed;
      const origAttackSpeed = attacker.attackSpeed;
      attacker.speed = Math.floor(origSpeed * (1 - slowAmount));
      attacker.attackSpeed = Math.floor(origAttackSpeed / (1 - slowAmount * 0.5));
      // Show ice particle on attacker
      const iceFlash = this.scene.add.circle(attacker.x, attacker.y, 18, 0x88EEFF, 0.5);
      iceFlash.setDepth(200);
      this.scene.tweens.add({ targets: iceFlash, alpha: 0, duration: 500, onComplete: () => iceFlash.destroy() });
      // Unslow after 1.5s
      this.scene.time.delayedCall(1500, () => {
        if (!attacker.isDead) {
          attacker.speed = origSpeed;
          attacker.attackSpeed = origAttackSpeed;
        }
        attacker._frostSlowed = false;
      });
    }

    this.health -= finalDamage;
    
    // Update health bar with smooth animation
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.scene.tweens.add({
      targets: this.healthBar,
      width: 60 * healthPercent,
      duration: 200,
      ease: 'Power2'
    });
    
    // Flash red
    this.scene.tweens.add({
      targets: this.sprite,
      tint: 0xff0000,
      duration: 100,
      yoyo: true,
      onComplete: () => {
        this.sprite.clearTint();
      }
    });
    
    // Play hurt sound effect with positional audio
    this.playHurtSound();
    
    // Floating damage number
    this.showDamageNumber(finalDamage);
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  playHurtSound() {
    // Use SoundEffectsManager for impact sound
    soundEffects.playImpact();
  }
  
  showDamageNumber(amount) {
    const damageText = this.scene.add.text(this.x, this.y - 40, `-${Math.floor(amount)}`, {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 4,
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(1000);
    
    // Float up and fade out
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  die() {
    if (this.isDead) return;
    this.isDead = true;

    // Clean up berserker visual
    if (this.berserkerVisual) {
      this.berserkerVisual.destroy();
      this.berserkerVisual = null;
    }

    // Remove from unit arrays immediately to prevent filtering every frame
    if (!this.isEnemy) {
      const index = this.scene.playerUnits.indexOf(this);
      if (index > -1) {
        this.scene.playerUnits.splice(index, 1);
      }
      // Track player loss
      if (this.scene.stats) this.scene.stats.unitsLost = (this.scene.stats.unitsLost || 0) + 1;
    } else {
      const index = this.scene.enemyUnits.indexOf(this);
      if (index > -1) {
        this.scene.enemyUnits.splice(index, 1);
      }
      // Track enemy kill
      if (this.scene.stats) this.scene.stats.enemiesKilled = (this.scene.stats.enemiesKilled || 0) + 1;
      // Notify kill feed
      if (this.scene.addKillFeedEntry) {
        this.scene.addKillFeedEntry(this.config.name, true);
      }
      // Small screen shake on kill
      if (this.scene.cameras && this.scene.cameras.main) {
        this.scene.cameras.main.shake(80, 0.003);
      }
    }

    // Faction-specific death animations
    this.playDeathAnimation();
  }
  
  playDeathAnimation() {
    // Play death sound
    soundEffects.playUnitDeath(this.factionId);
    
    // Stop any existing animations
    if (this.idleTween) this.idleTween.stop();
    
    switch(this.factionId) {
      case 'roman':
        this.romanDeathAnimation();
        break;
      case 'alien':
        this.alienDeathAnimation();
        break;
      case 'viking':
        this.vikingDeathAnimation();
        break;
      default:
        this.genericDeathAnimation();
    }
  }
  
  romanDeathAnimation() {
    // Romans fall with spinning stars
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const star = this.scene.add.text(this.x, this.y - 50, '⭐', {
        fontSize: '24px',
      });
      star.setDepth(1000);
      stars.push(star);
      
      const angle = (i / 3) * Math.PI * 2;
      this.scene.tweens.add({
        targets: star,
        x: this.x + Math.cos(angle) * 60,
        y: this.y - 80 + Math.sin(angle) * 60,
        alpha: 0,
        angle: 360,
        duration: 800,
        ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
    
    // Unit falls and spins
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 20,
      angle: this.isEnemy ? -360 : 360,
      duration: 800,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }
  
  alienDeathAnimation() {
    // Aliens pop like green balloon with slime
    // Pop effect - expand and vanish
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.5,
      scaleY: 0.15 * 1.5,
      duration: 100,
      onComplete: () => {
        // Create slime particles
        for (let i = 0; i < 8; i++) {
          const particle = this.scene.add.circle(
            this.x,
            this.y,
            Phaser.Math.Between(3, 8),
            0x00FF00,
            0.8
          );
          particle.setDepth(999);
          
          const angle = (i / 8) * Math.PI * 2;
          const distance = Phaser.Math.Between(30, 60);
          
          this.scene.tweens.add({
            targets: particle,
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance + 20,
            alpha: 0,
            scaleX: 0.5,
            scaleY: 2,
            duration: 400,
            ease: 'Power2',
            onComplete: () => particle.destroy(),
          });
        }
        
        // Quick fade
        this.scene.tweens.add({
          targets: this,
          alpha: 0,
          duration: 150,
          onComplete: () => this.destroy(),
        });
      }
    });
  }
  
  vikingDeathAnimation() {
    // Vikings fade with Valhalla light beam upward
    // Create light beam
    const beam = this.scene.add.rectangle(
      this.x,
      this.y - 100,
      40,
      200,
      0xFFD700,
      0.6
    );
    beam.setDepth(998);
    
    this.scene.tweens.add({
      targets: beam,
      alpha: 0,
      y: this.y - 300,
      scaleY: 3,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => beam.destroy(),
    });
    
    // Add particles rising
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(
        this.x + Phaser.Math.Between(-15, 15),
        this.y,
        4,
        0xFFFFFF,
        0.8
      );
      particle.setDepth(999);
      
      this.scene.tweens.add({
        targets: particle,
        y: this.y - 250,
        alpha: 0,
        duration: 800 + i * 100,
        ease: 'Power1',
        onComplete: () => particle.destroy(),
      });
    }
    
    // Unit fades upward
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y - 30,
      duration: 800,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }
  
  genericDeathAnimation() {
    // Fallback for unknown factions
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      y: this.y + 30,
      angle: this.isEnemy ? -90 : 90,
      duration: 500,
      ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }
}
