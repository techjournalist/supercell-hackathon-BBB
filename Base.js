import Phaser from 'phaser';
import { CONFIG } from './config.js';

export class Base extends Phaser.GameObjects.Container {
  constructor(scene, x, y, isEnemy = false, spriteKey = null, factionId = 'roman') {
    super(scene, x, y);
    
    this.scene = scene;
    this.isEnemy = isEnemy;
    this.factionId = factionId;
    
    // Stats
    this.maxHealth = CONFIG.BASE_MAX_HEALTH;
    this.health = this.maxHealth;
    this.isDead = false;
    
    // Create castle sprite
    if (!spriteKey) {
      spriteKey = isEnemy ? 'alien-base' : 'player-castle';
    }
    this.castle = scene.add.sprite(0, 0, spriteKey);
    this.castle.setScale(0.25);
    
    // Health bar background (larger for base)
    this.healthBarBg = scene.add.rectangle(0, -120, 100, 12, CONFIG.COLORS.healthBarBg);
    
    // Health bar
    this.healthBar = scene.add.rectangle(0, -120, 100, 12, 
      isEnemy ? CONFIG.COLORS.enemyHealth : CONFIG.COLORS.playerHealth);
    
    this.add([this.castle, this.healthBarBg, this.healthBar]);
    
    scene.add.existing(this);
    
    // Start faction-specific idle animations
    this.startIdleAnimation();
  }
  
  startIdleAnimation() {
    // Faction-specific base animations
    switch(this.factionId) {
      case 'roman':
        this.romanBaseAnimation();
        break;
      case 'alien':
        this.alienBaseAnimation();
        break;
      case 'viking':
        this.vikingBaseAnimation();
        break;
    }
  }
  
  romanBaseAnimation() {
    // Roman flags wave - gentle sway
    this.scene.tweens.add({
      targets: this.castle,
      angle: -2,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  alienBaseAnimation() {
    // UFO lights blink and rotate
    // Gentle rotation
    this.scene.tweens.add({
      targets: this.castle,
      angle: 360,
      duration: 20000,
      repeat: -1,
      ease: 'Linear',
    });
    
    // Pulsing glow effect (subtle scale instead of alpha to keep visibility)
    this.scene.tweens.add({
      targets: this.castle,
      scale: 0.26,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  vikingBaseAnimation() {
    // Longhouse torches flicker - subtle vertical bob
    this.scene.tweens.add({
      targets: this.castle,
      y: '+=3',
      duration: 800 + Math.random() * 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
  
  takeDamage(amount, fromX, fromY) {
    if (this.isDead) return;
    
    this.health -= amount;
    
    // Update health bar with smooth animation
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.scene.tweens.add({
      targets: this.healthBar,
      width: 100 * healthPercent,
      duration: 200,
      ease: 'Power2'
    });
    
    // Shake UI health bar based on which base is hit
    if (this.isEnemy && this.scene.enemyBaseHealthBarBg) {
      this.scene.tweens.add({
        targets: [this.scene.enemyBaseHealthBarBg, this.scene.enemyBaseHealthBarFill, this.scene.enemyBaseHealthText],
        x: '+=3',
        duration: 50,
        yoyo: true,
        repeat: 2,
        ease: 'Power2'
      });
    } else if (!this.isEnemy && this.scene.playerBaseHealthBarBg) {
      this.scene.tweens.add({
        targets: [this.scene.playerBaseHealthBarBg, this.scene.playerBaseHealthBarFill, this.scene.playerBaseHealthText],
        x: '+=3',
        duration: 50,
        yoyo: true,
        repeat: 2,
        ease: 'Power2'
      });
      
      // Flash the shield icon red when player base is hit
      if (this.scene.playerBaseShieldIcon) {
        this.scene.playerBaseShieldIcon.setVisible(true);
        this.scene.playerBaseShieldIcon.setTint(0xFF0000);
        this.scene.time.delayedCall(300, () => {
          if (this.scene.playerBaseShieldIcon) {
            this.scene.playerBaseShieldIcon.clearTint();
          }
        });
      }
    }
    
    // Floating damage number
    this.showDamageNumber(amount);
    
    // Shake effect
    this.scene.tweens.add({
      targets: this.castle,
      x: this.castle.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.castle.x = 0;
      }
    });
    
    // Flash red
    this.scene.tweens.add({
      targets: this.castle,
      tint: 0xff0000,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.castle.clearTint();
      }
    });
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  showDamageNumber(amount) {
    const damageText = this.scene.add.text(this.x, this.y - 80, `-${amount}`, {
      fontSize: '32px',
      fontFamily: 'Press Start 2P',
      color: '#ff0000',
      stroke: '#000000',
      strokeThickness: 5,
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(1000);
    damageText.setScrollFactor(1);
    
    // Float up and fade out
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 60,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  die() {
    this.isDead = true;
    
    // Game over!
    // If enemy base dies -> player wins (true)
    // If player base dies -> player loses (false)
    const playerWon = this.isEnemy;  // isEnemy = true means enemy base died = player wins
    
    // For campaign mode, save progress before showing victory
    if (playerWon && this.scene.campaignLevel && !this.scene.levelCompleted) {
      this.scene.levelCompleted = true;
      
      let campaignComplete = false;
      let campaignType = 'roman';
      
      // Save campaign progress
      if (this.scene.vikingCampaign) {
        const newProgress = this.scene.campaignLevel + 1;
        localStorage.setItem('vikingCampaignProgress', newProgress.toString());
        this.scene.registry.set('vikingCampaignProgress', newProgress);
        console.log('VIKING campaign progress saved:', newProgress);
        campaignType = 'viking';
        if (this.scene.campaignLevel === 8) {
          campaignComplete = true;
        }
      } else if (this.scene.alienCampaign) {
        const newProgress = this.scene.alienLevel + 1;
        localStorage.setItem('alienCampaignProgress', newProgress.toString());
        this.scene.registry.set('alienCampaignProgress', newProgress);
        console.log('ALIEN campaign progress saved:', newProgress);
        campaignType = 'alien';
        if (this.scene.alienLevel === 8) {
          campaignComplete = true;
        }
      } else {
        // Roman campaign
        const newProgress = this.scene.campaignLevel + 1;
        localStorage.setItem('campaignProgress', newProgress.toString());
        this.scene.registry.set('campaignProgress', newProgress);
        console.log('ROMAN campaign progress saved:', newProgress);
        campaignType = 'roman';
        if (this.scene.campaignLevel === 8) {
          campaignComplete = true;
        }
      }
      
      // If campaign complete, show special celebration scene
      if (campaignComplete) {
        console.log('🎉 CAMPAIGN COMPLETE! Showing celebration...');
        
        // Calculate total campaign time
        const campaignEndTime = Date.now();
        const campaignStartKey = `${campaignType}_campaign_start`;
        const campaignStartTime = parseInt(localStorage.getItem(campaignStartKey) || campaignEndTime.toString());
        const totalTimeSeconds = Math.floor((campaignEndTime - campaignStartTime) / 1000);
        
        // Clear the start time
        localStorage.removeItem(campaignStartKey);
        
        console.log(`Campaign completed in ${totalTimeSeconds} seconds`);
        
        this.scene.time.delayedCall(1000, () => {
          this.scene.cameras.main.fadeOut(1000, 0, 0, 0);
          this.scene.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.scene.start('CampaignCompleteScene', { 
              campaign: campaignType,
              completionTime: totalTimeSeconds
            });
          });
        });
        return; // Don't call gameOver, go to celebration instead
      }
    }
    
    this.scene.gameOver(playerWon);
  }
}
