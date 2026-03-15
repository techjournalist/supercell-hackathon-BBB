import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { AudioManager } from './AudioManager.js';
import { soundEffects } from './SoundEffectsManager.js';
import * as Tone from 'tone';
import { UNIT_SPRITE_SHEETS } from './BaseGameScene.js';

export class Unit extends Phaser.GameObjects.Container {
  constructor(scene, x, y, config, isEnemy = false, factionId = 'roman') {
    super(scene, x, y);

    this.scene = scene;
    this.config = config;
    this.isEnemy = isEnemy;
    this.factionId = factionId;

    this.maxHealth = config.health;
    this.health = this.maxHealth;
    this.damage = config.damage;
    this.attackRange = config.attackRange;
    this.attackSpeed = config.attackSpeed;
    this.speed = config.speed;

    this.target = null;
    this.lastAttackTime = 0;
    this.isDead = false;
    this.isAttacking = false;

    // Random spawn variation for visual depth
    this._spawnYOffset = (Math.random() - 0.5) * 8;
    this._spawnTilt = (Math.random() - 0.5) * 2;
    this.y += this._spawnYOffset;

    // Drop shadow
    this.shadow = scene.add.ellipse(0, 18, 36, 10, 0x000000, 0.28);
    this.add(this.shadow);

    // Limb graphics for walk cycle
    this._legL = scene.add.graphics();
    this._legR = scene.add.graphics();
    this._armL = scene.add.graphics();
    this._armR = scene.add.graphics();
    this.add([this._legL, this._legR, this._armL, this._armR]);

    // Sprite
    const spriteKey = this.getSpriteKey();
    this._walkAnimKey = scene.textures.exists(`${spriteKey}_walk`) ? `${spriteKey}_walk` : null;
    this._attackAnimKey = scene.textures.exists(`${spriteKey}_attack`) ? `${spriteKey}_attack` : null;
    this._hasSpritesheetAnims = !!this._walkAnimKey;

    const initialKey = this._walkAnimKey || spriteKey;
    this.sprite = scene.add.sprite(0, 0, initialKey);
    this.sprite.setScale(0.15);
    this.sprite.rotation = this._spawnTilt * (Math.PI / 180);
    this.updateFacing();

    // Health bar background
    this.healthBarBg = scene.add.rectangle(0, -60, 60, 8, CONFIG.COLORS.healthBarBg);
    this.healthBar = scene.add.rectangle(0, -60, 60, 8,
      isEnemy ? CONFIG.COLORS.enemyHealth : CONFIG.COLORS.playerHealth);

    this.add([this.sprite, this.healthBarBg, this.healthBar]);

    scene.add.existing(this);
    this.setDepth(12);

    this.walkPhase = Math.random() * Math.PI * 2;
    this.idlePhase = Math.random() * Math.PI * 2;
    this._lastAuraCheck = 0;
    this._lastDustStep = 0;
    this._isWalking = false;
    this._lowHpTintActive = false;
    this._criticalHpFlicker = false;
    this._flickerTimer = 0;

    // Commander glow effect
    this._isCommander = ['Centurion', 'Jarl', 'Overlord'].includes(config.name);
    this._commanderOrbitAngle = Math.random() * Math.PI * 2;
    this._commanderOrbitParticles = [];
    this._commanderPulseTimer = 0;

    if (this._isCommander) {
      this._setupCommanderGlow();
    }

    this.startIdleAnimation();
  }

  _getUnitProfile() {
    const name = this.config.name;
    const profiles = {
      'Worker':       { legLen: 10, legWidth: 2, armLen: 8,  bodyColor: 0xBB8844, legColor: 0x886633, footColor: 0x554422 },
      'Thrall':       { legLen: 10, legWidth: 2, armLen: 8,  bodyColor: 0xAA7733, legColor: 0x775522, footColor: 0x443311 },
      'Harvester':    { legLen: 8,  legWidth: 2, armLen: 6,  bodyColor: 0x33AA66, legColor: 0x228844, footColor: 0x115533 },
      'Legionary':    { legLen: 12, legWidth: 3, armLen: 10, bodyColor: 0xCC2222, legColor: 0x882222, footColor: 0x551111 },
      'Pilum Thrower':{ legLen: 11, legWidth: 2, armLen: 10, bodyColor: 0xCC5500, legColor: 0x883300, footColor: 0x552200 },
      'Centurion':    { legLen: 15, legWidth: 4, armLen: 12, bodyColor: 0xFFD700, legColor: 0xAA8800, footColor: 0x665500 },
      'Scout':        { legLen: 13, legWidth: 2, armLen: 9,  bodyColor: 0x558800, legColor: 0x336600, footColor: 0x224400 },
      'Drone':        { legLen: 0,  legWidth: 0, armLen: 0,  bodyColor: 0x22AA44, legColor: 0x116633, footColor: 0x00441E },
      'Blaster':      { legLen: 11, legWidth: 2, armLen: 10, bodyColor: 0x00BB66, legColor: 0x007744, footColor: 0x004422 },
      'Overlord':     { legLen: 14, legWidth: 4, armLen: 12, bodyColor: 0x00FF88, legColor: 0x00AA55, footColor: 0x005533 },
      'Alien Scout':  { legLen: 12, legWidth: 2, armLen: 8,  bodyColor: 0x44FF99, legColor: 0x22AA66, footColor: 0x115533 },
      'Berserker':    { legLen: 13, legWidth: 3, armLen: 11, bodyColor: 0xDD4400, legColor: 0x882200, footColor: 0x441100 },
      'Axe Thrower':  { legLen: 11, legWidth: 2, armLen: 10, bodyColor: 0x996633, legColor: 0x664422, footColor: 0x332211 },
      'Jarl':         { legLen: 16, legWidth: 4, armLen: 13, bodyColor: 0x4488CC, legColor: 0x225588, footColor: 0x113355 },
    };
    return profiles[name] || { legLen: 11, legWidth: 2, armLen: 9, bodyColor: 0x888888, legColor: 0x555555, footColor: 0x333333 };
  }

  _drawLimbs(walkPhaseOffset) {
    const profile = this._getUnitProfile();
    if (profile.legLen === 0) {
      this._legL.clear();
      this._legR.clear();
      this._armL.clear();
      this._armR.clear();
      return;
    }

    const ll = profile.legLen;
    const lw = profile.legWidth;
    const al = profile.armLen;
    const lc = profile.legColor;
    const fc = profile.footColor;
    const bc = profile.bodyColor;

    // Walk cycle swings
    const legSwing = Math.sin(walkPhaseOffset) * 8;
    const armSwing = Math.sin(walkPhaseOffset + Math.PI) * 6;

    const bodyBase = 12; // y offset from sprite center to hip

    // Left leg
    this._legL.clear();
    this._legL.lineStyle(lw + 1, fc, 0.9);
    this._legL.beginPath();
    this._legL.moveTo(-5, bodyBase);
    this._legL.lineTo(-5 + legSwing * 0.4, bodyBase + ll);
    this._legL.strokePath();
    this._legL.fillStyle(fc, 1);
    this._legL.fillCircle(-5 + legSwing * 0.4, bodyBase + ll, lw);

    // Right leg (opposite phase)
    this._legR.clear();
    this._legR.lineStyle(lw + 1, lc, 0.9);
    this._legR.beginPath();
    this._legR.moveTo(5, bodyBase);
    this._legR.lineTo(5 - legSwing * 0.4, bodyBase + ll);
    this._legR.strokePath();
    this._legR.fillStyle(lc, 1);
    this._legR.fillCircle(5 - legSwing * 0.4, bodyBase + ll, lw);

    // Left arm
    this._armL.clear();
    this._armL.lineStyle(Math.max(1, lw - 1), bc, 0.8);
    this._armL.beginPath();
    this._armL.moveTo(-8, 0);
    this._armL.lineTo(-8 - armSwing * 0.3, al);
    this._armL.strokePath();

    // Right arm
    this._armR.clear();
    this._armR.lineStyle(Math.max(1, lw - 1), bc, 0.8);
    this._armR.beginPath();
    this._armR.moveTo(8, 0);
    this._armR.lineTo(8 + armSwing * 0.3, al);
    this._armR.strokePath();
  }

  _clearLimbs() {
    this._legL.clear();
    this._legR.clear();
    this._armL.clear();
    this._armR.clear();
  }

  _setupCommanderGlow() {
    const name = this.config.name;
    const numOrbs = name === 'Overlord' ? 4 : 6;
    const orbColor = name === 'Centurion' ? 0xFFD700 :
                     name === 'Jarl'      ? 0x88BBFF :
                                            0x00FF88;

    for (let i = 0; i < numOrbs; i++) {
      const orb = this.scene.add.circle(0, 0, name === 'Overlord' ? 4 : 3, orbColor, 0.85);
      orb._phase = (i / numOrbs) * Math.PI * 2;
      this.add(orb);
      this._commanderOrbitParticles.push(orb);
    }

    // Glow ring
    this._commanderGlowRing = this.scene.add.graphics();
    this.add(this._commanderGlowRing);

    // Overlord gets tentacle stubs
    if (name === 'Overlord') {
      this._tentacles = [];
      for (let i = 0; i < 4; i++) {
        const t = this.scene.add.graphics();
        this.add(t);
        this._tentacles.push(t);
      }
    }
  }

  _updateCommanderEffects(time, delta) {
    const name = this.config.name;
    const orbitRadius = 30;
    const orbitSpeed = name === 'Overlord' ? 0.8 : 1.2;

    this._commanderOrbitAngle += orbitSpeed * (delta / 1000);

    this._commanderOrbitParticles.forEach((orb, i) => {
      const angle = orb._phase + this._commanderOrbitAngle;
      const rx = Math.cos(angle) * orbitRadius;
      const ry = Math.sin(angle) * (orbitRadius * 0.35);
      orb.setPosition(rx, ry - 10);
      const pulse = 0.5 + 0.5 * Math.sin(time * 0.003 + i);
      orb.setAlpha(0.6 + 0.4 * pulse);
      orb.setScale(0.7 + 0.4 * pulse);
    });

    // Pulsing glow ring
    if (this._commanderGlowRing) {
      this._commanderGlowRing.clear();
      const ringColor = name === 'Centurion' ? 0xFFD700 :
                        name === 'Jarl'      ? 0x88BBFF :
                                               0x00FF88;
      const ringAlpha = 0.08 + 0.07 * Math.sin(time * 0.004);
      this._commanderGlowRing.lineStyle(6, ringColor, ringAlpha);
      this._commanderGlowRing.strokeCircle(0, -8, 28);
      this._commanderGlowRing.lineStyle(2, ringColor, ringAlpha * 2);
      this._commanderGlowRing.strokeCircle(0, -8, 22);
    }

    // Overlord tentacles
    if (this._tentacles && name === 'Overlord') {
      this._tentacles.forEach((t, i) => {
        t.clear();
        const baseAngle = (i / 4) * Math.PI * 2 + time * 0.001;
        const extension = 12 + 6 * Math.sin(time * 0.002 + i * 1.5);
        const ex = Math.cos(baseAngle) * extension;
        const ey = Math.sin(baseAngle) * extension * 0.5;
        t.lineStyle(2, 0x00FF88, 0.5);
        t.beginPath();
        t.moveTo(0, 8);
        t.lineTo(ex, 8 + ey);
        t.strokePath();
        t.fillStyle(0x00FF88, 0.6);
        t.fillCircle(ex, 8 + ey, 2);
      });
    }
  }

  startIdleAnimation() {
    if (this.idleTween) this.idleTween.stop();

    const name = this.config.name;

    // Berserker micro-tremor idle
    if (name === 'Berserker') {
      this.idleTween = this.scene.tweens.add({
        targets: this.sprite,
        x: '+=1.5',
        duration: 80,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return;
    }

    // Drone/Overlord float hover
    if (name === 'Drone' || name === 'Overlord') {
      const tweenProps = {
        targets: this.sprite,
        y: '+=5',
        duration: 1400 + Math.random() * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      };
      if (!this._hasSpritesheetAnims) {
        tweenProps.scaleX = { value: this.sprite.scaleX * 1.02, yoyo: true };
        tweenProps.scaleY = { value: 0.15 * 1.02, yoyo: true };
      }
      this.idleTween = this.scene.tweens.add(tweenProps);
      return;
    }

    // Default gentle bob
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
    if (this.idleTween) {
      this.idleTween.stop();
      this.sprite.y = 0;
    }
    this._isWalking = true;
    if (this._hasSpritesheetAnims && this._walkAnimKey) {
      if (this.scene.anims.exists(this._walkAnimKey)) {
        this.sprite.play(this._walkAnimKey, true);
      }
    }
  }

  stopWalkAnimation() {
    this.sprite.y = 0;
    this._isWalking = false;
    this._clearLimbs();
    if (this._hasSpritesheetAnims && this._walkAnimKey) {
      this.sprite.stop();
    }
    this.startIdleAnimation();
  }

  getSpriteKey() {
    if (this.config.name === 'Worker') return 'worker';
    if (this.config.name === 'Harvester') return 'harvester';
    if (this.config.name === 'Thrall') return 'thrall';

    if (this.config.name === 'Scout') {
      return this.isEnemy ? 'alien-scout' : 'scout';
    }

    if (this.config.name === 'Legionary') return 'legionary';
    if (this.config.name === 'Pilum Thrower') return 'pilum';
    if (this.config.name === 'Centurion') return 'centurion';

    if (this.config.name === 'Drone') return 'drone';
    if (this.config.name === 'Blaster') return 'blaster';
    if (this.config.name === 'Overlord') return 'overlord';

    if (this.config.name === 'Berserker') return 'berserker';
    if (this.config.name === 'Axe Thrower') return 'axeThrower';
    if (this.config.name === 'Jarl') return 'jarl';

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
    if (this.isEnemy) {
      if (this.config.name === 'Overlord') {
        this.sprite.setScale(0.15, 0.15);
      } else {
        this.sprite.setScale(-0.15, 0.15);
      }
    } else {
      this.sprite.setScale(-0.15, 0.15);
    }
  }

  _updateShadow(isMoving) {
    if (!this.shadow) return;
    const speed = this.speed || 100;
    const stretchX = isMoving ? 1 + speed * 0.003 : 1;
    this.shadow.setScale(stretchX, 1);
    this.shadow.setAlpha(isMoving ? 0.22 : 0.28);
  }

  _updateHealthVisuals() {
    const pct = this.health / this.maxHealth;

    if (pct <= 0.25) {
      // Critical: flicker effect managed in update loop
      this._criticalHpFlicker = true;
      this._lowHpTintActive = false;
      if (!this._cracksGraphic) {
        this._cracksGraphic = this.scene.add.graphics();
        this._cracksGraphic.setDepth(1);
        this.add(this._cracksGraphic);
        this._drawCracks();
      }
    } else if (pct <= 0.5) {
      this._criticalHpFlicker = false;
      this._lowHpTintActive = true;
      this.sprite.setTint(0xFF7777);
      if (this._cracksGraphic) {
        this._cracksGraphic.destroy();
        this._cracksGraphic = null;
      }
    } else {
      this._criticalHpFlicker = false;
      if (this._lowHpTintActive) {
        this._lowHpTintActive = false;
        this.sprite.clearTint();
      }
      if (this._cracksGraphic) {
        this._cracksGraphic.destroy();
        this._cracksGraphic = null;
      }
    }
  }

  _drawCracks() {
    if (!this._cracksGraphic) return;
    this._cracksGraphic.clear();
    this._cracksGraphic.lineStyle(1, 0xFF3300, 0.6);
    // Three short crack lines at random angles
    const lines = [
      { ox: -6, oy: -5, len: 10, ang: 0.8 },
      { ox: 5,  oy: -8, len: 8,  ang: -0.5 },
      { ox: 0,  oy: 4,  len: 9,  ang: 1.4 },
    ];
    lines.forEach(l => {
      this._cracksGraphic.beginPath();
      this._cracksGraphic.moveTo(l.ox, l.oy);
      this._cracksGraphic.lineTo(l.ox + Math.cos(l.ang) * l.len, l.oy + Math.sin(l.ang) * l.len);
      this._cracksGraphic.strokePath();
    });
  }

  _spawnFootDust(x, y) {
    const dustColors = {
      roman:  0xD4B483,
      viking: 0xBB9966,
      alien:  0x55FF99,
    };
    const color = dustColors[this.factionId] || 0xCCBB99;
    const dir = this.isEnemy ? 1 : -1;

    for (let i = 0; i < 2; i++) {
      const dust = this.scene.add.circle(
        x + (Math.random() - 0.5) * 10,
        y + 14,
        2 + Math.random() * 2,
        color,
        0.55
      );
      dust.setDepth(11);
      this.scene.tweens.add({
        targets: dust,
        x: dust.x + dir * (8 + Math.random() * 10),
        y: dust.y - (4 + Math.random() * 6),
        alpha: 0,
        scaleX: 2.5,
        scaleY: 2.5,
        duration: 220 + Math.random() * 80,
        ease: 'Power2',
        onComplete: () => dust.destroy(),
      });
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

    if (time - this._lastAuraCheck >= 200) {
      this._lastAuraCheck = time;
      this.applyAuraEffects();
    }

    // Commander effects
    if (this._isCommander) {
      this._updateCommanderEffects(time, delta);
    }

    // Critical HP flicker
    if (this._criticalHpFlicker) {
      this._flickerTimer += delta;
      if (this._flickerTimer > 400) {
        this._flickerTimer = 0;
        this.sprite.setAlpha(this.sprite.alpha > 0.5 ? 0.35 : 1.0);
      }
    }

    const enemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;
    const enemyBase = this.isEnemy ? this.scene.playerBase : this.scene.enemyBase;
    const enemyMine = this.isEnemy ? this.scene.playerMine : this.scene.enemyMine;

    let closestTarget = null;
    let closestDist = Infinity;

    enemies.forEach(enemy => {
      if (enemy.isDead || enemy.isWorker) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestTarget = enemy;
      }
    });

    if (enemyMine && !enemyMine.isDead) {
      const mineDist = Phaser.Math.Distance.Between(this.x, this.y, enemyMine.x, enemyMine.y);
      if (mineDist < closestDist) {
        closestDist = mineDist;
        closestTarget = enemyMine;
      }
    }

    const baseDist = Phaser.Math.Distance.Between(this.x, this.y, enemyBase.x, enemyBase.y);
    if (baseDist < closestDist) {
      closestDist = baseDist;
      closestTarget = enemyBase;
    }

    this.target = closestTarget;

    if (this.target && closestDist <= this.attackRange) {
      if (time - this.lastAttackTime >= this.attackSpeed && !this.isAttacking) {
        this.attack();
        this.lastAttackTime = time;
      }
      // Stopped - idle limbs
      if (this._isWalking) {
        this.stopWalkAnimation();
      }
      this._updateShadow(false);
    } else {
      if (!this._isWalking) {
        this.startWalkAnimation();
      }
      this._updateShadow(true);

      if (!this.isEnemy && this.config.name === 'Scout' && this.scene.explorationAIEnabled) {
        this.exploreUnknownAreas(time, delta);
      } else if (this.isEnemy && this.isAIScout) {
        this.aiScoutBehavior(time, delta);
      } else if (!this.isEnemy && this._rallyTarget) {
        const dx = this._rallyTarget.x - this.x;
        const dist = Math.abs(dx);
        if (dist > 80) {
          const dir = Math.sign(dx);
          this.x += dir * this.speed * (delta / 1000);
        } else {
          this._rallyTarget = null;
        }
      } else {
        const direction = this.isEnemy ? -1 : 1;
        this.x += direction * this.speed * (delta / 1000);

        const oldWalkPhase = this.walkPhase || 0;
        this.walkPhase = (this.walkPhase || 0) + (delta / 1000) * this.speed * 0.05;

        if (this._hasSpritesheetAnims) {
          const oldStep = Math.floor(oldWalkPhase / Math.PI);
          const newStep = Math.floor(this.walkPhase / Math.PI);
          if (oldStep !== newStep) {
            soundEffects.playFootstep(this.factionId);
            this._spawnFootDust(this.x, this.y);
          }
        } else {
          const bounceAmount = Math.sin(this.walkPhase) * 5;
          this.sprite.y = bounceAmount;

          this._drawLimbs(this.walkPhase);

          const oldStep = Math.floor(oldWalkPhase / Math.PI);
          const newStep = Math.floor(this.walkPhase / Math.PI);
          if (oldStep !== newStep) {
            soundEffects.playFootstep(this.factionId);
            this._spawnFootDust(this.x, this.y);
          }

          const squashAmount = 1 + Math.sin(this.walkPhase) * 0.02;
          const currentScaleX = this.sprite.scaleX;
          const scaleSign = Math.sign(currentScaleX);
          this.sprite.setScale(scaleSign * 0.15 * squashAmount, 0.15 / squashAmount);
        }
      }
    }

    // Elevation-based perspective depth cue
    const groundY = this.scene.groundY || (this.scene.scale.height * 0.75);
    const elevationAbove = groundY - (this.y - this._spawnYOffset);
    if (elevationAbove > 10) {
      const depthScale = Math.max(0.75, 1 - elevationAbove * 0.0015);
      const baseScaleX = this.sprite.scaleX;
      const baseScaleY = this.sprite.scaleY;
      const signX = Math.sign(baseScaleX);
      this.sprite.setScale(signX * Math.abs(baseScaleX) * depthScale, Math.abs(baseScaleY) * depthScale);
      this.sprite.setAlpha(Math.max(0.7, 1 - elevationAbove * 0.001));
    }
  }

  exploreUnknownAreas(time, delta) {
    if (!this.explorationTarget || this.hasReachedTarget()) {
      this.explorationTarget = this.findUnexploredArea();
    }

    if (this.explorationTarget) {
      const dx = this.explorationTarget.x - this.x;
      const dy = this.explorationTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 20) {
        this.x += (dx / distance) * this.speed * (delta / 1000);
        this.y += (dy / distance) * this.speed * (delta / 1000);
      } else {
        this.explorationTarget = null;
      }
    } else {
      this.patrolBehavior(time, delta);
    }
  }

  hasReachedTarget() {
    if (this.explorationTarget) {
      return Phaser.Math.Distance.Between(this.x, this.y, this.explorationTarget.x, this.explorationTarget.y) < 50;
    }
    if (this.monitorTarget) {
      return Phaser.Math.Distance.Between(this.x, this.y, this.monitorTarget.x, this.monitorTarget.y) < 50;
    }
    return true;
  }

  findUnexploredArea() {
    const samplePoints = [];
    const worldWidth = CONFIG.WORLD_WIDTH;
    const sampleSize = 10;

    for (let i = 0; i < sampleSize; i++) {
      const x = Math.random() * worldWidth;
      const y = this.scene.groundY - 40 + (Math.random() - 0.5) * 100;
      if (!this.scene.isInPlayerVision(x, y)) {
        samplePoints.push({ x, y, score: this.calculateExplorationScore(x, y) });
      }
    }

    samplePoints.sort((a, b) => b.score - a.score);
    return samplePoints.length > 0 ? samplePoints[0] : null;
  }

  calculateExplorationScore(x, y) {
    const distFromSelf = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    const distFromPlayerBase = Math.abs(x - CONFIG.PLAYER_BASE_X);
    const distFromEnemyBase = Math.abs(x - CONFIG.ENEMY_BASE_X);
    let score = 0;
    if (distFromSelf < 1000) score += (1000 - distFromSelf) / 10;
    score += distFromPlayerBase / 100;
    if (distFromEnemyBase < 1500) score += (1500 - distFromEnemyBase) / 50;
    return score;
  }

  patrolBehavior(time, delta) {
    if (!this.patrolTarget) {
      const midPoint = CONFIG.WORLD_WIDTH / 2;
      this.patrolTarget = { x: midPoint + (Math.random() - 0.5) * 1000, y: this.scene.groundY - 40 };
    }

    const dx = this.patrolTarget.x - this.x;
    if (Math.abs(dx) > 20) {
      this.x += Math.sign(dx) * this.speed * (delta / 1000);
    } else {
      this.patrolTarget = null;
    }
  }

  aiScoutBehavior(time, delta) {
    if (this.scoutingPhase === 'explore') {
      const targetX = CONFIG.PLAYER_BASE_X + 400;
      const targetY = this.scene.groundY - 40;
      const dx = targetX - this.x;
      const dy = targetY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 100) {
        this.x += (dx / distance) * this.speed * (delta / 1000);
        this.y += (dy / distance) * this.speed * (delta / 1000);
      } else {
        this.scoutingPhase = 'monitor';
      }
    }

    if (this.scoutingPhase === 'monitor') {
      const beingChased = this.scene.playerUnits.some(u => {
        if (u.isDead) return false;
        return Phaser.Math.Distance.Between(this.x, this.y, u.x, u.y) < 200 && u.target === this;
      });

      if (!beingChased && time - this.lastScoutReport >= 3000) {
        this.reportEnemyPositions();
        this.lastScoutReport = time;
      }

      if (!this.monitorTarget || this.hasReachedTarget()) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 600;
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
          this.x += (dx / distance) * this.speed * (delta / 1000);
          this.y += (dy / distance) * this.speed * (delta / 1000);
        } else {
          this.monitorTarget = null;
        }
      }

      const nearbyEnemies = this.scene.playerUnits.filter(u => {
        if (u.isDead) return false;
        return Phaser.Math.Distance.Between(this.x, this.y, u.x, u.y) < 300;
      });

      if (nearbyEnemies.length >= 4 && this.health < this.maxHealth * 0.5) {
        this.scoutingPhase = 'retreat';
        this.retreatTarget = { x: CONFIG.ENEMY_BASE_X - 400, y: this.scene.groundY - 40 };
      }
    }

    if (this.scoutingPhase === 'retreat') {
      const dx = this.retreatTarget.x - this.x;
      const dy = this.retreatTarget.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 100) {
        this.x += (dx / distance) * this.speed * (delta / 1000);
        this.y += (dy / distance) * this.speed * (delta / 1000);
      } else {
        this.scoutingPhase = 'explore';
      }
    }
  }

  reportEnemyPositions() {
    const scoutedUnits = [];
    const visionRange = 245 * (this.config.visionMultiplier || 1);

    this.scene.playerUnits.forEach(unit => {
      if (unit.isDead) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, unit.x, unit.y);
      if (dist <= visionRange) {
        scoutedUnits.push({ x: unit.x, y: unit.y, type: unit.config.name, hp: unit.health, timestamp: Date.now() });
      }
    });

    if (scoutedUnits.length > 0) {
      this.scene.aiScoutTargets = scoutedUnits;
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0.5,
        duration: 150,
        yoyo: true,
        repeat: 1,
      });
      this.showScoutWarning();
    }
  }

  showScoutWarning() {
    const warningIcon = this.scene.add.text(this.x, this.y - 80, '⚠️', { fontSize: '24px' });
    warningIcon.setDepth(600);
    this.scene.tweens.add({
      targets: warningIcon,
      y: this.y - 120,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => warningIcon.destroy(),
    });
    if (!this.scene.lastScoutWarningTime || Date.now() - this.scene.lastScoutWarningTime > 10000) {
      this.scene.showScoutDetectedNotification();
      this.scene.lastScoutWarningTime = Date.now();
    }
  }

  getEffectiveDamage() {
    let dmg = this.damage;

    if (this.config.berserkerThreshold && this.health / this.maxHealth < this.config.berserkerThreshold) {
      dmg = Math.floor(dmg * (1 + (this.config.berserkerBonus || 0.25)));
      if (!this.berserkerVisual) {
        this.berserkerVisual = this.scene.add.circle(0, 0, 28, 0xFF3300, 0.25);
        this.add(this.berserkerVisual);
        this.scene.tweens.add({
          targets: this.berserkerVisual,
          alpha: 0.5,
          scale: 1.2,
          duration: 280,
          yoyo: true,
          repeat: -1,
        });
        // Enhanced rage spikes
        if (!this._rageSpikes) {
          this._rageSpikes = this.scene.add.graphics();
          this.add(this._rageSpikes);
          this._drawRageSpikes();
        }
      }
    } else if (this.berserkerVisual) {
      this.berserkerVisual.destroy();
      this.berserkerVisual = null;
      if (this._rageSpikes) {
        this._rageSpikes.destroy();
        this._rageSpikes = null;
      }
    }

    if (this.auraBoostActive) {
      dmg = Math.floor(dmg * (1 + (this.auraBoostAmount || 0)));
    }

    return dmg;
  }

  _drawRageSpikes() {
    if (!this._rageSpikes) return;
    this._rageSpikes.clear();
    const numSpikes = 8;
    for (let i = 0; i < numSpikes; i++) {
      const angle = (i / numSpikes) * Math.PI * 2;
      const innerR = 24;
      const outerR = 36 + Math.random() * 6;
      this._rageSpikes.lineStyle(2, 0xFF5500, 0.7);
      this._rageSpikes.beginPath();
      this._rageSpikes.moveTo(Math.cos(angle) * innerR, Math.sin(angle) * innerR);
      this._rageSpikes.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR);
      this._rageSpikes.strokePath();
    }
  }

  calculateRangedDamage(baseDamage, distance) {
    const falloff = this.config.rangedDamageFalloff;
    if (!falloff || this.attackRange <= 100) return baseDamage;
    const pct = Math.min(1, distance / this.attackRange);
    return Math.max(1, Math.floor(baseDamage * (1 - (1 - falloff) * pct)));
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
        },
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
        const pulse = 0.7 + 0.3 * Math.sin(progress * Math.PI * 6);
        bolt.lineStyle(5, 0x00FF88, 0.35 * pulse);
        bolt.beginPath();
        const bx = cx + Math.cos(bolt._angle) * laserLen * 0.5;
        const by = cy + Math.sin(bolt._angle) * laserLen * 0.5;
        const ex = cx - Math.cos(bolt._angle) * laserLen * 0.5;
        const ey = cy - Math.sin(bolt._angle) * laserLen * 0.5;
        bolt.moveTo(bx, by);
        bolt.lineTo(ex, ey);
        bolt.strokePath();
        bolt.lineStyle(2, 0xAAFFCC, 0.9 * pulse);
        bolt.beginPath();
        bolt.moveTo(bx, by);
        bolt.lineTo(ex, ey);
        bolt.strokePath();
      };
      drawBolt(0);
      this.scene.tweens.addCounter({
        from: 0, to: 1,
        duration: travelDuration,
        ease: 'Linear',
        onUpdate: (tween) => drawBolt(tween.getValue()),
        onComplete: () => { this.spawnImpactFlash(targetX, targetY, type); bolt.destroy(); },
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
        from: 0, to: 1,
        duration: travelDuration,
        ease: 'Cubic.easeIn',
        onUpdate: (tween) => {
          const t = tween.getValue();
          drawPilum(startX + dx * t, startY + dy * t + Math.sin(t * Math.PI) * -12);
        },
        onComplete: () => { this.spawnImpactFlash(targetX, targetY, type); pilum.destroy(); },
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
        this.scene.tweens.add({ targets: spark, scaleX: 0.1, alpha: 0, duration: 200, ease: 'Power2', onComplete: () => spark.destroy() });
      }
      this.scene.tweens.add({ targets: flash, scaleX: 2.2, scaleY: 2.2, alpha: 0, duration: 220, ease: 'Power2', onComplete: () => flash.destroy() });

    } else if (type === 'laser') {
      const ring = this.scene.add.circle(x, y, 6, 0x00FF88, 0);
      ring.setDepth(16);
      ring.setStrokeStyle(2, 0x00FF88, 0.9);
      const glow = this.scene.add.circle(x, y, 8, 0x00FF88, 0.5);
      glow.setDepth(15);
      this.scene.tweens.add({ targets: ring, scaleX: 3, scaleY: 3, alpha: 0, duration: 280, ease: 'Power2', onComplete: () => ring.destroy() });
      this.scene.tweens.add({ targets: glow, scaleX: 0.1, scaleY: 0.1, alpha: 0, duration: 180, ease: 'Power3', onComplete: () => glow.destroy() });

    } else {
      const spark = this.scene.add.circle(x, y, 6, 0xFF9900, 0.9);
      spark.setDepth(16);
      this.scene.tweens.add({ targets: spark, scaleX: 2.5, scaleY: 2.5, alpha: 0, duration: 200, ease: 'Power2', onComplete: () => spark.destroy() });
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
    if (weaponType === 'roman_sword') this.spawnSwordSlash(swingDir);
    else if (weaponType === 'viking_heavy') this.spawnAxeSmash(swingDir, true);
    else if (weaponType === 'viking_light') this.spawnAxeSmash(swingDir, false);
    else if (weaponType === 'alien_claw') this.spawnClawSwipe(targetX, targetY);
  }

  spawnSwordSlash(swingDir) {
    const gfx = this.scene.add.graphics();
    gfx.setDepth(20);
    const cx = this.x + swingDir * 20;
    const cy = this.y - 10;
    const radius = 32;
    const startAngle = swingDir === 1 ? Phaser.Math.DegToRad(-60) : Phaser.Math.DegToRad(120);
    const endAngle = swingDir === 1 ? Phaser.Math.DegToRad(60) : Phaser.Math.DegToRad(240);

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
        gfx.fillStyle(0xFFFFFF, alpha * 0.9);
        gfx.fillCircle(cx + Math.cos(tipAngle) * radius, cy + Math.sin(tipAngle) * radius, 3);
      }
    };

    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: 200, ease: 'Cubic.easeOut',
      onUpdate: (tween) => drawSlash(tween.getValue()),
      onComplete: () => gfx.destroy(),
    });

    const trailLine = this.scene.add.graphics();
    trailLine.setDepth(19);
    this.scene.time.delayedCall(60, () => {
      const trailAngle = startAngle + (endAngle - startAngle) * 0.4;
      trailLine.lineStyle(1.5, 0xCCCCFF, 0.5);
      trailLine.beginPath();
      trailLine.moveTo(cx + Math.cos(trailAngle) * (radius - 8), cy + Math.sin(trailAngle) * (radius - 8));
      trailLine.lineTo(cx + Math.cos(trailAngle) * (radius + 8), cy + Math.sin(trailAngle) * (radius + 8));
      trailLine.strokePath();
      this.scene.tweens.add({ targets: trailLine, alpha: 0, duration: 120, onComplete: () => trailLine.destroy() });
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
    const startAngle = swingDir === 1 ? Phaser.Math.DegToRad(-80) : Phaser.Math.DegToRad(100);
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

    this.scene.tweens.addCounter({
      from: 0, to: 1, duration: heavy ? 220 : 170, ease: 'Cubic.easeOut',
      onUpdate: (tween) => drawSmash(tween.getValue()),
      onComplete: () => gfx.destroy(),
    });

    if (heavy) {
      const dustX = this.x + swingDir * 36;
      const dustY = this.y + 10;
      for (let i = 0; i < 4; i++) {
        const dust = this.scene.add.circle(dustX + Phaser.Math.Between(-8, 8), dustY, Phaser.Math.Between(4, 8), 0xBB8844, 0.55);
        dust.setDepth(18);
        this.scene.tweens.add({
          targets: dust,
          x: dust.x + swingDir * Phaser.Math.Between(10, 22),
          y: dust.y - Phaser.Math.Between(8, 18),
          alpha: 0, scaleX: 2, scaleY: 2, duration: 280, ease: 'Power2', delay: i * 30,
          onComplete: () => dust.destroy(),
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

    clawOffsets.forEach((offset, i) => {
      const gfx = this.scene.add.graphics();
      gfx.setDepth(20);
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
        from: 0, to: 1, duration: 200, ease: 'Cubic.easeOut', delay: i * 18,
        onUpdate: (tween) => drawClaw(tween.getValue()),
        onComplete: () => gfx.destroy(),
      });
    });

    this.scene.time.delayedCall(160, () => {
      const splatterX = cx + swingDir * (clawLen * 0.8);
      for (let i = 0; i < 3; i++) {
        const dot = this.scene.add.circle(splatterX + Phaser.Math.Between(-10, 10), cy + Phaser.Math.Between(-8, 8), Phaser.Math.Between(2, 4), 0x00DD66, 0.75);
        dot.setDepth(21);
        this.scene.tweens.add({
          targets: dot,
          x: dot.x + Phaser.Math.Between(-12, 12),
          y: dot.y + Phaser.Math.Between(4, 14),
          alpha: 0, duration: 250, ease: 'Power2',
          onComplete: () => dot.destroy(),
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

    if (this._hasSpritesheetAnims && this._attackAnimKey && this.scene.anims.exists(this._attackAnimKey)) {
      this.sprite.play(this._attackAnimKey, true);
      this.sprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        if (this.target && !this.target.isDead) {
          const base = this.getEffectiveDamage();
          const final = this.calculateRangedDamage(base, distToTarget);
          this.target.takeDamage(final, this.x, this.y, this);
          this.playAttackSound();
        }
        this.sprite.x = 0;
        this.isAttacking = false;
        if (this._isWalking && this._walkAnimKey && this.scene.anims.exists(this._walkAnimKey)) {
          this.sprite.play(this._walkAnimKey, true);
        }
      });
    } else {
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
        },
      });
    }
  }

  playAttackSound() {
    if (this.config.attackRange > 100) {
      if (this.factionId === 'alien') soundEffects.playLaser('C5');
      else soundEffects.playLaser('E5');
    } else {
      soundEffects.playMeleeAttack(this.factionId);
    }
  }

  takeDamage(amount, fromX, fromY, attacker) {
    if (this.isDead) return;

    let finalDamage = amount;
    if (this.shieldActive) finalDamage *= 0.5;
    if (this.damageReduction) finalDamage *= (1 - this.damageReduction);
    finalDamage = Math.max(1, finalDamage);

    if (this.frostSlowActive && attacker && !attacker.isDead && !attacker._frostSlowed) {
      const slowAmount = this.frostSlowAmount || 0.4;
      attacker._frostSlowed = true;
      const origSpeed = attacker.speed;
      const origAttackSpeed = attacker.attackSpeed;
      attacker.speed = Math.floor(origSpeed * (1 - slowAmount));
      attacker.attackSpeed = Math.floor(origAttackSpeed / (1 - slowAmount * 0.5));
      const iceFlash = this.scene.add.circle(attacker.x, attacker.y, 18, 0x88EEFF, 0.5);
      iceFlash.setDepth(200);
      this.scene.tweens.add({ targets: iceFlash, alpha: 0, duration: 500, onComplete: () => iceFlash.destroy() });
      this.scene.time.delayedCall(1500, () => {
        if (!attacker.isDead) {
          attacker.speed = origSpeed;
          attacker.attackSpeed = origAttackSpeed;
        }
        attacker._frostSlowed = false;
      });
    }

    this.health -= finalDamage;

    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.scene.tweens.add({
      targets: this.healthBar,
      width: 60 * healthPercent,
      duration: 200,
      ease: 'Power2',
    });

    this._updateHealthVisuals();

    // Flash red (skip if already tinted by low-hp system)
    if (!this._lowHpTintActive && !this._criticalHpFlicker) {
      this.scene.tweens.add({
        targets: this.sprite,
        tint: 0xff0000,
        duration: 100,
        yoyo: true,
        onComplete: () => this.sprite.clearTint(),
      });
    }

    this.playHurtSound();
    this.showDamageNumber(finalDamage);

    if (this.health <= 0) this.die();
  }

  playHurtSound() {
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
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 50,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => damageText.destroy(),
    });
  }

  die() {
    if (this.isDead) return;
    this.isDead = true;

    if (this.berserkerVisual) { this.berserkerVisual.destroy(); this.berserkerVisual = null; }
    if (this._rageSpikes) { this._rageSpikes.destroy(); this._rageSpikes = null; }
    if (this._cracksGraphic) { this._cracksGraphic.destroy(); this._cracksGraphic = null; }
    if (this.shadow) { this.shadow.destroy(); this.shadow = null; }

    // Destroy commander orbit particles
    this._commanderOrbitParticles.forEach(p => p.destroy());
    this._commanderOrbitParticles = [];
    if (this._commanderGlowRing) { this._commanderGlowRing.destroy(); this._commanderGlowRing = null; }
    if (this._tentacles) { this._tentacles.forEach(t => t.destroy()); this._tentacles = null; }

    if (!this.isEnemy) {
      const index = this.scene.playerUnits.indexOf(this);
      if (index > -1) this.scene.playerUnits.splice(index, 1);
      if (this.scene.stats) this.scene.stats.unitsLost = (this.scene.stats.unitsLost || 0) + 1;
    } else {
      const index = this.scene.enemyUnits.indexOf(this);
      if (index > -1) this.scene.enemyUnits.splice(index, 1);
      if (this.scene.stats) this.scene.stats.enemiesKilled = (this.scene.stats.enemiesKilled || 0) + 1;
      if (this.scene.addKillFeedEntry) this.scene.addKillFeedEntry(this.config.name, true);
      if (this.scene.cameras && this.scene.cameras.main) this.scene.cameras.main.shake(80, 0.003);
    }

    this.playDeathAnimation();
  }

  playDeathAnimation() {
    soundEffects.playUnitDeath(this.factionId);
    if (this.idleTween) this.idleTween.stop();
    this._clearLimbs();

    switch(this.factionId) {
      case 'roman':  this.romanDeathAnimation();  break;
      case 'alien':  this.alienDeathAnimation();   break;
      case 'viking': this.vikingDeathAnimation();  break;
      default:       this.genericDeathAnimation(); break;
    }
  }

  romanDeathAnimation() {
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const star = this.scene.add.text(this.x, this.y - 50, '⭐', { fontSize: '24px' });
      star.setDepth(1000);
      stars.push(star);
      const angle = (i / 3) * Math.PI * 2;
      this.scene.tweens.add({
        targets: star,
        x: this.x + Math.cos(angle) * 60,
        y: this.y - 80 + Math.sin(angle) * 60,
        alpha: 0, angle: 360, duration: 800, ease: 'Power2',
        onComplete: () => star.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: this,
      alpha: 0, y: this.y + 20,
      angle: this.isEnemy ? -360 : 360,
      duration: 800, ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }

  alienDeathAnimation() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleX: this.sprite.scaleX * 1.5,
      scaleY: 0.15 * 1.5,
      duration: 100,
      onComplete: () => {
        for (let i = 0; i < 8; i++) {
          const particle = this.scene.add.circle(this.x, this.y, Phaser.Math.Between(3, 8), 0x00FF00, 0.8);
          particle.setDepth(999);
          const angle = (i / 8) * Math.PI * 2;
          const distance = Phaser.Math.Between(30, 60);
          this.scene.tweens.add({
            targets: particle,
            x: this.x + Math.cos(angle) * distance,
            y: this.y + Math.sin(angle) * distance + 20,
            alpha: 0, scaleX: 0.5, scaleY: 2, duration: 400, ease: 'Power2',
            onComplete: () => particle.destroy(),
          });
        }
        this.scene.tweens.add({
          targets: this, alpha: 0, duration: 150,
          onComplete: () => this.destroy(),
        });
      },
    });
  }

  vikingDeathAnimation() {
    const beam = this.scene.add.rectangle(this.x, this.y - 100, 40, 200, 0xFFD700, 0.6);
    beam.setDepth(998);
    this.scene.tweens.add({
      targets: beam, alpha: 0, y: this.y - 300, scaleY: 3, duration: 1000, ease: 'Power2',
      onComplete: () => beam.destroy(),
    });
    for (let i = 0; i < 5; i++) {
      const particle = this.scene.add.circle(this.x + Phaser.Math.Between(-15, 15), this.y, 4, 0xFFFFFF, 0.8);
      particle.setDepth(999);
      this.scene.tweens.add({
        targets: particle, y: this.y - 250, alpha: 0, duration: 800 + i * 100, ease: 'Power1',
        onComplete: () => particle.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: this, alpha: 0, y: this.y - 30, duration: 800, ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }

  genericDeathAnimation() {
    this.scene.tweens.add({
      targets: this, alpha: 0, y: this.y + 30,
      angle: this.isEnemy ? -90 : 90,
      duration: 500, ease: 'Power2',
      onComplete: () => this.destroy(),
    });
  }
}
