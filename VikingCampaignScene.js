import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { MusicManager } from './MusicManager.js';

export class VikingCampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VikingCampaignScene' });
  }
  
  preload() {
    this.load.image('erik', 'https://rosebud.ai/assets/erik-portrait.webp?e1Ak');
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
  }

  create() {
    const { width, height } = this.scale;

    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);

    if (AudioManager.shouldPlayMusic()) {
      MusicManager.play('viking-music');
    }

    this.input.once('pointerdown', () => {
      MusicManager.tryUnlock();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('viking-music');
      }
    });
    
    // Title
    const title = this.add.text(width / 2, 80, 'VIKING CAMPAIGN', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P',
      color: '#87CEEB',
      stroke: '#2C3E50',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Subtitle - Erik the Adequate
    const subtitle = this.add.text(width / 2, 140, 'with Erik the Adequate', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#CCCCCC',
      fontStyle: 'italic',
    });
    subtitle.setOrigin(0.5);
    
    // Get campaign progress from localStorage (persists between scenes)
    const progress = parseInt(localStorage.getItem('vikingCampaignProgress') || '1');
    
    // Also set in registry for other scenes to use
    this.registry.set('vikingCampaignProgress', progress);
    
    // Campaign levels
    const levels = [
      { num: 1, name: 'Raiding Party', desc: 'Tutorial: Train miners and berserkers' },
      { num: 2, name: 'Axe to Grind', desc: 'Destroy the Roman fort' },
      { num: 3, name: 'Frozen Stand', desc: 'Survive 3 minutes of alien waves' },
      { num: 4, name: 'Thor\'s Chosen', desc: 'Limited units, use spells to win' },
      { num: 5, name: 'Two Front War', desc: 'Enemies attack from both sides' },
      { num: 6, name: 'Ragnarok', desc: 'Destroy the alien mothership' },
    ];
    
    const startY = 220;
    const spacing = 90;
    
    levels.forEach((level, index) => {
      const y = startY + index * spacing;
      const isUnlocked = level.num <= progress;
      
      // Level container
      const container = this.add.container(width / 2, y);
      
      // Background panel
      const panel = this.add.rectangle(0, 0, 700, 70, isUnlocked ? 0x4A7BA7 : 0x555555, 0.8);
      panel.setStrokeStyle(3, isUnlocked ? 0x87CEEB : 0x888888);
      container.add(panel);
      
      if (isUnlocked) {
        panel.setInteractive({ useHandCursor: true });
        
        panel.on('pointerover', () => {
          panel.setFillStyle(0x6A9BC7, 0.9);
        });
        
        panel.on('pointerout', () => {
          panel.setFillStyle(0x4A7BA7, 0.8);
        });
        
        panel.on('pointerdown', () => {
          this.startLevel(level.num);
        });
      }
      
      // Level number and name
      const levelText = this.add.text(-330, -15, `LEVEL ${level.num}: ${level.name}`, {
        fontSize: '18px',
        fontFamily: 'Press Start 2P',
        color: isUnlocked ? '#FFFFFF' : '#888888',
      });
      container.add(levelText);
      
      // Description
      const descText = this.add.text(-330, 10, level.desc, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: isUnlocked ? '#CCCCCC' : '#666666',
      });
      container.add(descText);
      
      // Lock icon
      if (!isUnlocked) {
        const lock = this.add.text(320, 0, '🔒', {
          fontSize: '24px',
        });
        lock.setOrigin(0.5);
        container.add(lock);
      }
    });
    
    // Back button
    this.createBackButton(100, height - 80);
  }
  
  stopVikingMusic() {
    MusicManager.stop();
  }
  
  createBackButton(x, y) {
    const backButton = this.add.rectangle(x, y, 200, 50, 0x8B4513);
    backButton.setInteractive({ useHandCursor: true });
    backButton.setStrokeStyle(3, 0xFFD700);
    
    const backText = this.add.text(x, y, 'BACK', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    backText.setOrigin(0.5);
    
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xA0522D);
    });
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x8B4513);
    });
    
    backButton.on('pointerdown', () => {
      this.stopVikingMusic();
      this.scene.start('MenuScene');
    });
  }
  
  startLevel(levelNum) {
    console.log('Starting level', levelNum);
    // Store level and viking campaign flag in registry
    this.registry.set('campaignLevel', levelNum);
    this.registry.set('vikingCampaign', true);
    
    // Stop Viking music before starting level
    this.stopVikingMusic();
    
    this.scene.start('VikingComicIntroScene');
  }
  
  shutdown() {}
}
