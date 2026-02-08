import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { Unit } from './Unit.js';

export class Thrall extends Unit {
  constructor(scene, x, y, config, isEnemy = false) {
    super(scene, x, y, config, isEnemy);
    
    this.isWorker = true;
    this.isMining = false;
    this.mineTarget = null;
    this.hasGold = false;
    this.miningStartTime = 0;
  }
  
  update(time, delta) {
    if (this.isDead) return;
    
    // Find closest mine if we don't have a target
    if (!this.mineTarget || this.mineTarget.destroyed) {
      this.findClosestMine();
    }
    
    // Check for nearby enemies and flee
    const enemies = this.isEnemy ? this.scene.playerUnits : this.scene.enemyUnits;
    const nearbyEnemies = enemies.filter(enemy => {
      if (enemy.isDead || enemy.isWorker) return false;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
      return dist < CONFIG.WORKER_FLEE_DISTANCE;
    });
    
    if (nearbyEnemies.length > 0) {
      // Flee toward base
      const baseX = this.isEnemy ? CONFIG.ENEMY_BASE_X : CONFIG.PLAYER_BASE_X;
      const direction = this.x < baseX ? 1 : -1;
      this.x += direction * this.speed * 1.5 * (delta / 1000); // Move faster when fleeing
      this.isMining = false;
      return;
    }
    
    if (!this.mineTarget) return;
    
    // If we have gold, return to base
    if (this.hasGold) {
      const baseX = this.isEnemy ? CONFIG.ENEMY_BASE_X : CONFIG.PLAYER_BASE_X;
      const distToBase = Math.abs(this.x - baseX);
      
      if (distToBase > 50) {
        // Move toward base
        const direction = this.x < baseX ? 1 : -1;
        this.x += direction * this.speed * (delta / 1000);
      } else {
        // Deposit gold
        if (this.isEnemy) {
          this.scene.enemyGold += CONFIG.GOLD_PER_TRIP;
        } else {
          this.scene.gold += CONFIG.GOLD_PER_TRIP;
        }
        this.hasGold = false;
        this.isMining = false;
      }
    } else {
      // Move to mine
      const distToMine = Math.abs(this.x - this.mineTarget.x);
      
      if (distToMine > 80) {
        // Move toward mine
        const direction = this.x < this.mineTarget.x ? 1 : -1;
        this.x += direction * this.speed * (delta / 1000);
        this.isMining = false;
      } else {
        // Start mining
        if (!this.isMining) {
          this.isMining = true;
          this.miningStartTime = time;
        }
        
        // Check if mining complete
        if (time - this.miningStartTime >= CONFIG.MINING_TIME) {
          this.hasGold = true;
          this.isMining = false;
        }
      }
    }
  }
  
  findClosestMine() {
    const mines = this.isEnemy ? this.scene.enemyGoldMines : this.scene.playerGoldMines;
    if (!mines || mines.length === 0) return;
    
    let closestMine = null;
    let closestDist = Infinity;
    
    mines.forEach(mine => {
      if (mine.destroyed) return;
      const dist = Phaser.Math.Distance.Between(this.x, this.y, mine.x, mine.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestMine = mine;
      }
    });
    
    this.mineTarget = closestMine;
  }
}
