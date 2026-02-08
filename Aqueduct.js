import Phaser from 'phaser';
import { CONFIG } from './config.js';

export class Aqueduct extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    
    this.scene = scene;
    this.isUpgraded = false;
    this.manaRate = CONFIG.AQUEDUCT_MANA_RATE;
    
    // Create proper Roman aqueduct with multiple arches
    const archWidth = 45;
    const archHeight = 80;
    const numArches = 3;
    const totalWidth = numArches * archWidth;
    const startX = -(totalWidth / 2) + (archWidth / 2);
    
    this.arches = [];
    this.pillars = [];
    
    // Build multiple stone arches
    for (let i = 0; i < numArches; i++) {
      const archX = startX + (i * archWidth);
      
      // Stone pillars (left and right of each arch)
      const leftPillar = scene.add.rectangle(archX - 15, 10, 12, archHeight, 0xA0826D);
      leftPillar.setStrokeStyle(3, 0x6B5948);
      this.add(leftPillar);
      this.pillars.push(leftPillar);
      
      const rightPillar = scene.add.rectangle(archX + 15, 10, 12, archHeight, 0xA0826D);
      rightPillar.setStrokeStyle(3, 0x6B5948);
      this.add(rightPillar);
      this.pillars.push(rightPillar);
      
      // Arch top (curved appearance with rectangle)
      const archTop = scene.add.rectangle(archX, -30, 35, 15, 0x8B7355);
      archTop.setStrokeStyle(3, 0x6B5948);
      this.add(archTop);
      this.arches.push(archTop);
      
      // Arch opening shadow (darker for depth)
      const archShadow = scene.add.rectangle(archX, 0, 25, 50, 0x4A3C2F);
      archShadow.setStrokeStyle(2, 0x3A2C1F);
      this.add(archShadow);
    }
    
    // Water channel running along the top
    this.waterChannel = scene.add.rectangle(0, -37, totalWidth + 10, 10, 0x4FC3F7);
    this.waterChannel.setAlpha(0.8);
    this.waterChannel.setStrokeStyle(2, 0x3090C7);
    this.add(this.waterChannel);
    
    // Upgrade glow (initially hidden)
    this.upgradeGlow = scene.add.circle(0, -50, 12, 0x00FFFF);
    this.upgradeGlow.setAlpha(0);
    this.add(this.upgradeGlow);
    
    // Mana generation particles
    this.particleTimer = 0;
    
    scene.add.existing(this);
    
    // Animate water flow
    this.animateWater();
  }
  
  animateWater() {
    // Shimmer effect on water
    this.scene.tweens.add({
      targets: this.waterChannel,
      alpha: 0.6,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  update(time, delta) {
    // Generate blue water particle/glow effect while producing mana
    this.particleTimer += delta;
    
    if (this.particleTimer >= 500) {  // Every 0.5 seconds
      this.particleTimer = 0;
      
      // Spawn blue water droplet
      const dropX = this.x + (Math.random() - 0.5) * 120;
      const dropY = this.y - 37;
      
      const droplet = this.scene.add.circle(dropX, dropY, 3, 0x00FFFF);
      droplet.setAlpha(0.8);
      droplet.setDepth(this.depth + 1);
      
      this.scene.tweens.add({
        targets: droplet,
        y: dropY - 20,
        alpha: 0,
        duration: 800,
        ease: 'Power1',
        onComplete: () => droplet.destroy()
      });
    }
  }
  
  upgrade() {
    if (this.isUpgraded) return;
    
    this.isUpgraded = true;
    this.manaRate = CONFIG.AQUEDUCT_UPGRADED_RATE;
    
    // Show upgrade glow
    this.scene.tweens.add({
      targets: this.upgradeGlow,
      alpha: 0.7,
      duration: 300,
      ease: 'Power2'
    });
    
    // Pulse glow continuously
    this.scene.tweens.add({
      targets: this.upgradeGlow,
      scale: 1.4,
      alpha: 0.9,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Make water brighter and more vibrant
    this.waterChannel.setFillStyle(0x00D4FF);
    this.waterChannel.setAlpha(1);
    
    // Add cyan glow to arches
    this.arches.forEach(arch => {
      this.scene.tweens.add({
        targets: arch,
        alpha: 0.9,
        duration: 500,
      });
    });
  }
  
  getManaRate() {
    return this.manaRate;
  }
}
