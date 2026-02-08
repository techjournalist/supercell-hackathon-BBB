import Phaser from 'phaser';
import { CONFIG } from './config.js';
import { Worker } from './Worker.js';

export class Harvester extends Worker {
  constructor(scene, x, y, config, isEnemy = false) {
    super(scene, x, y, config, isEnemy);
    
    // Harvester uses different visual (already has UFO in sprite)
    // Just override the gold icon position
    this.goldIcon.y = -50;  // Higher up for the UFO
  }
  
  getSpriteKey() {
    return 'harvester';
  }
  
  mine_resource(time, delta) {
    // Harvester has a hover/float animation instead of bounce
    // Accumulate mining progress using delta (respects game speed)
    this.miningProgress += delta;
    
    const floatSpeed = 300;
    const floatAmount = 8;
    this.sprite.y = Math.sin((this.miningProgress / floatSpeed) * Math.PI * 2) * floatAmount;
    
    if (this.miningProgress >= CONFIG.MINING_TIME) {
      // Finished mining
      this.carryingGold = true;
      this.goldIcon.setVisible(true);
      this.state = 'returning';
      this.sprite.y = 0;
      this.miningProgress = 0; // Reset for next trip
    }
  }
}
