import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { MusicManager } from './MusicManager.js';

export class AlienCampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AlienCampaignScene' });
  }
  
  preload() {
    this.load.image('zyx9-portrait', 'https://rosebud.ai/assets/zyx9-portrait.webp?8tVr');
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
  }

  create() {
    const { width, height } = this.scale;

    if (AudioManager.shouldPlayMusic()) {
      MusicManager.play('alien-music');
    }

    this.input.once('pointerdown', () => {
      MusicManager.tryUnlock();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('alien-music');
      }
    });
    
    // Background image
    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);
    
    // Add semi-transparent overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);
    
    // Title
    const title = this.add.text(width / 2, 60, 'ALIEN CAMPAIGN', {
      fontSize: '36px',
      fontFamily: 'Press Start 2P',
      color: '#9C27B0',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Subtitle
    const subtitle = this.add.text(width / 2, 110, 'Overlord Zyx-9', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    subtitle.setOrigin(0.5);
    
    // Level buttons
    const startY = 180;
    const spacing = 70;
    
    const levels = [
      { num: 1, name: 'Abduction 101', desc: 'Tutorial' },
      { num: 2, name: 'Colony Strike', desc: 'Destroy Roman fort' },
      { num: 3, name: 'Harvest Season', desc: 'Collect 1500 gold' },
      { num: 4, name: 'Mind Games', desc: 'Use Mind Control 5x' },
      { num: 5, name: 'Invasion Force', desc: 'Destroy Viking base' },
      { num: 6, name: 'World Domination', desc: 'Final assault' },
    ];
    
    // Get campaign progress from localStorage
    const alienProgress = parseInt(localStorage.getItem('alienCampaignProgress') || '0');
    
    levels.forEach((level, index) => {
      const y = startY + index * spacing;
      const isUnlocked = index <= alienProgress;
      const isCompleted = index < alienProgress;
      
      // Button background
      const button = this.add.rectangle(width / 2 - 100, y, 500, 60, isUnlocked ? 0x4A148C : 0x333333);
      button.setOrigin(0, 0.5);
      button.setStrokeStyle(2, isUnlocked ? 0x9C27B0 : 0x666666);
      
      if (isUnlocked) {
        button.setInteractive({ useHandCursor: true });
        
        button.on('pointerover', () => {
          button.setFillStyle(0x6A1B9A);
        });
        
        button.on('pointerout', () => {
          button.setFillStyle(0x4A148C);
        });
        
        button.on('pointerdown', () => {
          this.startLevel(level.num);
        });
      }
      
      // Level number
      const numText = this.add.text(width / 2 - 80, y, `L${level.num}`, {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: isUnlocked ? '#FFFFFF' : '#666666',
      });
      numText.setOrigin(0, 0.5);
      
      // Level name
      const nameText = this.add.text(width / 2 - 30, y - 8, level.name, {
        fontSize: '16px',
        fontFamily: 'Press Start 2P',
        color: isUnlocked ? '#E1BEE7' : '#666666',
      });
      nameText.setOrigin(0, 0.5);
      
      // Description
      const descText = this.add.text(width / 2 - 30, y + 12, level.desc, {
        fontSize: '12px',
        fontFamily: 'Press Start 2P',
        color: isUnlocked ? '#9C27B0' : '#555555',
      });
      descText.setOrigin(0, 0.5);
      
      // Completion checkmark
      if (isCompleted) {
        const check = this.add.text(width / 2 + 380, y, '✓', {
          fontSize: '24px',
          color: '#00FF00',
        });
        check.setOrigin(0.5);
      }
    });
    
    // Back button
    const backButton = this.add.rectangle(80, height - 60, 140, 50, 0x4A148C);
    backButton.setStrokeStyle(2, 0x9C27B0);
    backButton.setInteractive({ useHandCursor: true });
    
    const backText = this.add.text(80, height - 60, 'BACK', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    backText.setOrigin(0.5);
    
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0x6A1B9A);
    });
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x4A148C);
    });
    
    backButton.on('pointerdown', () => {
      this.stopAlienMusic();
      this.scene.start('MenuScene');
    });
  }
  
  stopAlienMusic() {
    MusicManager.stop();
  }
  
  startLevel(levelNum) {
    console.log('Starting level', levelNum);
    
    // Stop Alien music before starting level
    this.stopAlienMusic();
    
    // Store level info in registry
    this.registry.set('alienCampaign', true);
    this.registry.set('alienLevel', levelNum);
    this.registry.set('campaignLevel', levelNum);
    
    // Start comic intro
    this.scene.start('AlienComicIntroScene');
  }
  
  shutdown() {}
}
