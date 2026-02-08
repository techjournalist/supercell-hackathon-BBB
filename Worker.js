import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { Unit } from './Unit.js';
import { soundEffects } from './SoundEffectsManager.js';

export class Worker extends Unit {
  constructor(scene, x, y, config, isEnemy = false) {
    super(scene, x, y, config, isEnemy);
    
    // Worker-specific state
    this.isWorker = true;
    this.state = 'idle';  // idle, going_to_mine, mining, returning, fleeing
    this.carryingGold = false;
    this.miningProgress = 0; // Accumulated time spent mining (in ms)
    this.mine = null;
    this.base = null;
    
    // Set references
    this.mine = isEnemy ? scene.enemyMine : scene.playerMine;
    this.base = isEnemy ? scene.enemyBase : scene.playerBase;
    
    // Visual indicator when carrying gold
    this.goldIcon = scene.add.circle(0, -40, 8, 0xFFD700);
    this.goldIcon.setStrokeStyle(2, 0x000000);
    this.goldIcon.setVisible(false);
    this.add(this.goldIcon);
    
    // Start working
    this.state = 'going_to_mine';
  }
  
  getSpriteKey() {
    return 'worker';
  }
  
  update(time, delta) {
    if (this.isDead) return;
    
    // Check for nearby enemies - flee if too close
    const enemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;
    let nearestEnemyDist = Infinity;
    
    enemies.forEach(enemy => {
      if (enemy.isDead || enemy.isWorker) return;  // Ignore other workers
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      if (dist < nearestEnemyDist) {
        nearestEnemyDist = dist;
      }
    });
    
    // Flee if enemy too close
    if (nearestEnemyDist < CONFIG.WORKER_FLEE_DISTANCE && this.state !== 'fleeing') {
      this.state = 'fleeing';
    }
    
    // Handle different states
    switch (this.state) {
      case 'fleeing':
        this.flee(delta);
        // If reached base or enemies gone, resume work
        if (nearestEnemyDist > CONFIG.WORKER_FLEE_DISTANCE * 1.5) {
          this.state = 'going_to_mine';
        }
        break;
        
      case 'going_to_mine':
        this.goToMine(delta);
        break;
        
      case 'mining':
        this.mine_resource(time, delta);
        break;
        
      case 'returning':
        this.returnToBase(delta);
        break;
    }
  }
  
  flee(delta) {
    // Run back to base
    const direction = this.isEnemy ? 1 : -1;  // Opposite of normal movement
    this.x += direction * this.speed * 1.5 * (delta / 1000);  // Move faster when fleeing
    
    const distToBase = Math.abs(this.x - this.base.x);
    if (distToBase < 100) {
      // Safe at base
      this.state = 'going_to_mine';
    }
  }
  
  goToMine(delta) {
    if (!this.mine) return;
    
    const direction = this.isEnemy ? -1 : 1;
    const distToMine = Math.abs(this.x - this.mine.x);
    
    if (distToMine < 50) {
      // Reached mine, start mining
      this.state = 'mining';
      this.miningProgress = 0; // Reset mining progress
    } else {
      // Walk to mine
      this.x += direction * this.speed * (delta / 1000);
    }
  }
  
  mine_resource(time, delta) {
    // Accumulate mining progress using delta (respects game speed)
    this.miningProgress += delta;
    
    // Mining animation - bounce up and down
    const bounceSpeed = 200;
    const bounceAmount = 5;
    this.sprite.y = Math.sin((this.miningProgress / bounceSpeed) * Math.PI * 2) * bounceAmount;
    
    if (this.miningProgress >= CONFIG.MINING_TIME) {
      // Finished mining
      this.carryingGold = true;
      this.goldIcon.setVisible(true);
      this.state = 'returning';
      this.sprite.y = 0;
      this.miningProgress = 0; // Reset for next trip
    }
  }
  
  returnToBase(delta) {
    if (!this.base) return;
    
    const direction = this.isEnemy ? 1 : -1;  // Opposite of going to mine
    const distToBase = Math.abs(this.x - this.base.x);
    
    if (distToBase < 150) {
      // Reached base, deposit gold
      this.depositGold();
    } else {
      // Walk back to base
      this.x += direction * this.speed * (delta / 1000);
    }
  }
  
  depositGold() {
    // Add gold to team
    if (this.isEnemy) {
      // Apply skirmish resource multiplier if active
      const multiplier = this.scene.aiResourceMultiplier || 1.0;
      this.scene.enemyGold += CONFIG.GOLD_PER_TRIP * multiplier;
    } else {
      this.scene.gold += CONFIG.GOLD_PER_TRIP;
      
      // Play resource collected sound
      soundEffects.playResourceCollected();
      
      // Show floating gold text
      const goldText = this.scene.add.text(this.x, this.y - 60, `+${CONFIG.GOLD_PER_TRIP}`, {
        fontSize: '28px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 4,
      });
      goldText.setOrigin(0.5);
      goldText.setDepth(1000);
      
      this.scene.tweens.add({
        targets: goldText,
        y: goldText.y - 50,
        alpha: 0,
        duration: 1000,
        ease: 'Power2',
        onComplete: () => {
          goldText.destroy();
        }
      });
    }
    
    // Reset and go back to mine
    this.carryingGold = false;
    this.goldIcon.setVisible(false);
    this.state = 'going_to_mine';
  }
  
  // Override attack - workers don't attack
  attack() {
    // Workers are peaceful!
  }
}
