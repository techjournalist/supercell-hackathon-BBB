import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';

export class VikingCampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VikingCampaignScene' });
  }
  
  preload() {
    // Load Erik portrait
    this.load.image('erik', 'https://rosebud.ai/assets/erik-portrait.webp.webp?e1Ak');
    // Load generic background
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
    // Load Viking background music
    this.load.audio('viking-music', 'https://rosebud.ai/assets/viking-background.mp3?O8ih');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Background image
    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);
    
    // Add semi-transparent overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);
    
    // Try to start Viking background music immediately
    this.musicStarted = false;
    this.attemptMusicStart();
    
    // Add click handler to start music if autoplay blocked
    this.input.once('pointerdown', () => {
      if (!this.musicStarted) {
        console.log('User interaction detected, starting music');
        this.attemptMusicStart();
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
  
  attemptMusicStart() {
    console.log('attemptMusicStart called');
    
    // Only start if music is enabled
    if (!AudioManager.shouldPlayMusic()) {
      console.log('Music disabled by AudioManager');
      return;
    }
    
    console.log('Music enabled, proceeding...');
    
    // Stop any existing menu music from other scenes
    const menuScene = this.scene.get('MenuScene');
    if (menuScene && menuScene.menuMusic && menuScene.menuMusic.isPlaying) {
      console.log('Stopping menu music');
      menuScene.menuMusic.stop();
    }
    
    // Stop Roman campaign music if playing
    const romanScene = this.scene.get('CampaignScene');
    if (romanScene && romanScene.romanMusic && romanScene.romanMusic.isPlaying) {
      console.log('Stopping Roman campaign music');
      romanScene.romanMusic.stop();
    }
    
    // Stop Alien campaign music if playing
    const alienScene = this.scene.get('AlienCampaignScene');
    if (alienScene && alienScene.alienMusic && alienScene.alienMusic.isPlaying) {
      console.log('Stopping Alien campaign music');
      alienScene.alienMusic.stop();
    }
    
    // Create and play Viking music
    if (!this.vikingMusic) {
      console.log('Creating viking music object');
      this.vikingMusic = this.sound.add('viking-music', {
        loop: true,
        volume: AudioManager.getEffectiveVolume('music')
      });
      
      // Add event listeners for debugging
      this.vikingMusic.once('play', () => {
        console.log('Viking music started playing!');
        this.musicStarted = true;
      });
      
      this.vikingMusic.once('looped', () => {
        console.log('Viking music looped');
      });
    }
    
    console.log('Sound context state:', this.sound.context ? this.sound.context.state : 'no context');
    console.log('Current volume:', AudioManager.getEffectiveVolume('music'));
    
    // Ensure audio context is resumed and play music
    if (this.sound.context) {
      if (this.sound.context.state === 'suspended') {
        console.log('Resuming audio context...');
        this.sound.context.resume().then(() => {
          console.log('Audio context resumed, playing music');
          this.vikingMusic.play();
        }).catch(err => {
          console.error('Failed to resume audio context:', err);
        });
      } else {
        console.log('Playing music directly (context already running)');
        try {
          this.vikingMusic.play();
        } catch (err) {
          console.error('Failed to play music:', err);
        }
      }
    } else {
      console.error('No sound context available!');
    }
    
    // Add music watchdog - check every 3 seconds (only once)
    if (!this.musicWatchdog) {
      this.musicWatchdog = this.time.addEvent({
        delay: 3000,
        callback: () => {
          if (AudioManager.shouldPlayMusic()) {
            if (!this.vikingMusic || !this.vikingMusic.isPlaying) {
              console.log('Viking music not playing, current state:', this.vikingMusic ? this.vikingMusic.isPlaying : 'no music object');
            }
          }
        },
        loop: true
      });
    }
  }
  
  stopVikingMusic() {
    // Stop watchdog
    if (this.musicWatchdog) {
      this.musicWatchdog.remove();
      this.musicWatchdog = null;
    }
    
    if (this.vikingMusic && this.vikingMusic.isPlaying) {
      // Fade out before stopping
      this.tweens.add({
        targets: this.vikingMusic,
        volume: 0,
        duration: 500,
        ease: 'Linear',
        onComplete: () => {
          if (this.vikingMusic) {
            this.vikingMusic.stop();
            this.vikingMusic.destroy();
            this.vikingMusic = null;
          }
        }
      });
    } else if (this.vikingMusic) {
      this.vikingMusic.destroy();
      this.vikingMusic = null;
    }
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
  
  shutdown() {
    // Clean up music when scene shuts down
    this.stopVikingMusic();
  }
}
