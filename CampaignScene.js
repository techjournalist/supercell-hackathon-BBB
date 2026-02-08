import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignScene' });
  }
  
  preload() {
    // Load generic background
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
    // Load Roman campaign music
    this.load.audio('roman-music', 'https://rosebud.ai/assets/roman-theme.mp3?cnOY');
  }
  
  create() {
    // Initialize music flags first
    this.musicStarted = false;
    
    // Build UI
    this.buildUI();
    
    // Start Roman campaign music after UI is built
    this.attemptMusicStart();
    
    // Add click handler to start music if autoplay blocked
    this.input.once('pointerdown', () => {
      if (!this.musicStarted) {
        console.log('User interaction detected, starting Roman music');
        this.attemptMusicStart();
      }
    });
    
    // Listen for when scene wakes up or resumes (returns from another scene)
    this.events.on('wake', () => {
      console.log('CampaignScene woke up, rebuilding UI');
      this.buildUI();
      // Restart music if needed
      if (!this.romanMusic || !this.romanMusic.isPlaying) {
        this.attemptMusicStart();
      }
    });
    
    this.events.on('resume', () => {
      console.log('CampaignScene resumed, rebuilding UI');
      this.buildUI();
      // Restart music if needed
      if (!this.romanMusic || !this.romanMusic.isPlaying) {
        this.attemptMusicStart();
      }
    });
  }
  
  // This method runs every time we return to the scene
  buildUI() {
    // Clear everything first
    this.children.removeAll();
    
    const { width, height } = this.scale;
    
    // Get campaign progress from localStorage (persists between scenes)
    const rawValue = localStorage.getItem('campaignProgress');
    const unlockedLevel = parseInt(rawValue || '1');
    
    // DEBUG: Log progress
    console.log('=== CAMPAIGN SCENE LOADED ===');
    console.log('Raw localStorage:', rawValue);
    console.log('Parsed level:', unlockedLevel);
    console.log('Unlocking levels 1-' + unlockedLevel);
    console.log('============================');
    
    // Also set in registry for other scenes to use
    this.registry.set('campaignProgress', unlockedLevel);
    
    // Background image
    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);
    
    // Add semi-transparent overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.3);
    overlay.setOrigin(0);
    
    // Title with decorative elements
    const titleBanner = this.add.rectangle(width / 2, 50, width * 0.6, 80, 0x000000, 0.7);
    titleBanner.setStrokeStyle(3, 0xFFD700);
    
    const title = this.add.text(width / 2, 50, 'ROMAN CAMPAIGN', {
      fontSize: '42px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Progress indicator
    const progressText = this.add.text(width / 2, 95, `PROGRESS: ${unlockedLevel - 1}/8 BATTLES WON`, {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 3,
    });
    progressText.setOrigin(0.5);
    
    // Campaign levels data with map coordinates (winding path)
    const levels = [
      { num: 1, name: 'Basic Training', desc: 'Learn the basics', icon: '⚔️', x: 0.15, y: 0.75 },
      { num: 2, name: 'First Contact', desc: 'Face your first aliens', icon: '👽', x: 0.25, y: 0.55 },
      { num: 3, name: 'Hold the Line', desc: 'Survive the onslaught', icon: '🛡️', x: 0.40, y: 0.45 },
      { num: 4, name: 'The Gauntlet', desc: 'No mercy, no retreat', icon: '⚡', x: 0.55, y: 0.35 },
      { num: 5, name: 'Mana Mastery', desc: 'Master your spells', icon: '💎', x: 0.65, y: 0.50 },
      { num: 6, name: 'Behind Enemy Lines', desc: 'Stealth assault', icon: '🗡️', x: 0.75, y: 0.65 },
      { num: 7, name: 'Alien Onslaught', desc: 'Full-scale war', icon: '💥', x: 0.85, y: 0.50 },
      { num: 8, name: 'The Mothership', desc: 'Final confrontation', icon: '🛸', x: 0.90, y: 0.30 },
    ];
    
    // Draw campaign path connecting the levels
    this.drawCampaignPath(levels, unlockedLevel, width, height);
    
    // Create level markers on the map
    levels.forEach((level, index) => {
      const x = width * level.x;
      const y = height * level.y;
      const isUnlocked = level.num <= unlockedLevel;
      const isCompleted = level.num < unlockedLevel;
      
      this.createMapLevelMarker(x, y, level, isUnlocked, isCompleted);
    });
    
    // Back button
    this.createBackButton(width / 2 - 150, height - 80);
    
    // DEBUG: Reset progress button
    this.createResetButton(width / 2 + 150, height - 80);
  }
  
  drawCampaignPath(levels, unlockedLevel, width, height) {
    const graphics = this.add.graphics();
    
    // Draw path connecting all levels
    for (let i = 0; i < levels.length - 1; i++) {
      const currentLevel = levels[i];
      const nextLevel = levels[i + 1];
      
      const x1 = width * currentLevel.x;
      const y1 = height * currentLevel.y;
      const x2 = width * nextLevel.x;
      const y2 = height * nextLevel.y;
      
      // Path style depends on completion
      const isPathUnlocked = i + 1 < unlockedLevel;
      const pathColor = isPathUnlocked ? 0xFFD700 : 0x555555;
      const pathAlpha = isPathUnlocked ? 0.8 : 0.4;
      
      // Draw dashed path line
      graphics.lineStyle(4, pathColor, pathAlpha);
      graphics.beginPath();
      graphics.moveTo(x1, y1);
      graphics.lineTo(x2, y2);
      graphics.strokePath();
      
      // Draw dash pattern for visual interest
      const dashLength = 20;
      const gapLength = 10;
      const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      
      let currentDistance = 0;
      while (currentDistance < distance) {
        const dashEnd = Math.min(currentDistance + dashLength, distance);
        const startX = x1 + Math.cos(angle) * currentDistance;
        const startY = y1 + Math.sin(angle) * currentDistance;
        const endX = x1 + Math.cos(angle) * dashEnd;
        const endY = y1 + Math.sin(angle) * dashEnd;
        
        graphics.lineStyle(6, pathColor, pathAlpha);
        graphics.beginPath();
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);
        graphics.strokePath();
        
        currentDistance += dashLength + gapLength;
      }
    }
  }
  
  createMapLevelMarker(x, y, level, isUnlocked, isCompleted) {
    const container = this.add.container(x, y);
    
    // Outer glow ring
    const glowSize = isUnlocked ? 70 : 60;
    const glowColor = isCompleted ? 0x00FF00 : (isUnlocked ? 0xFFD700 : 0x333333);
    const glow = this.add.circle(0, 0, glowSize, glowColor, 0.2);
    container.add(glow);
    
    // Pulsing animation for current level
    if (isUnlocked && !isCompleted) {
      this.tweens.add({
        targets: glow,
        scale: 1.2,
        alpha: 0.4,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Main marker circle
    const markerSize = 55;
    const markerColor = isCompleted ? 0x4CAF50 : (isUnlocked ? 0x8B4513 : 0x2C2C2C);
    const marker = this.add.circle(0, 0, markerSize, markerColor, 0.9);
    marker.setStrokeStyle(4, isUnlocked ? 0xFFD700 : 0x555555);
    container.add(marker);
    
    // Level icon
    const icon = this.add.text(0, -5, level.icon, {
      fontSize: '32px',
    });
    icon.setOrigin(0.5);
    container.add(icon);
    
    // Level number badge
    const numBadge = this.add.circle(30, -30, 18, 0x000000, 0.9);
    numBadge.setStrokeStyle(2, isUnlocked ? 0xFFD700 : 0x555555);
    container.add(numBadge);
    
    const numText = this.add.text(30, -30, level.num.toString(), {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: isUnlocked ? '#FFFFFF' : '#666666',
    });
    numText.setOrigin(0.5);
    container.add(numText);
    
    // Completion checkmark
    if (isCompleted) {
      const checkmark = this.add.text(30, 30, '✓', {
        fontSize: '28px',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 3,
      });
      checkmark.setOrigin(0.5);
      container.add(checkmark);
    }
    
    // Lock icon for locked levels
    if (!isUnlocked) {
      const lock = this.add.text(0, 35, '🔒', {
        fontSize: '24px',
      });
      lock.setOrigin(0.5);
      container.add(lock);
    }
    
    // Info panel (shown on hover)
    let infoPanel = null;
    
    if (isUnlocked) {
      marker.setInteractive({ useHandCursor: true });
      
      marker.on('pointerover', () => {
        // Highlight effect
        marker.setFillStyle(isCompleted ? 0x66BB6A : 0xA0522D, 0.9);
        container.setScale(1.1);
        
        // Show info panel
        infoPanel = this.createLevelInfoPanel(x, y, level);
      });
      
      marker.on('pointerout', () => {
        marker.setFillStyle(markerColor, 0.9);
        container.setScale(1);
        
        // Hide info panel
        if (infoPanel) {
          infoPanel.destroy();
          infoPanel = null;
        }
      });
      
      marker.on('pointerdown', () => {
        // Flash effect before starting
        this.tweens.add({
          targets: marker,
          scale: 0.9,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            this.startLevel(level.num);
          }
        });
      });
    }
  }
  
  createLevelInfoPanel(x, y, level) {
    const { width, height } = this.scale;
    
    // Position panel to avoid screen edges
    let panelX = x + 100;
    let panelY = y;
    
    if (panelX + 250 > width - 20) {
      panelX = x - 100;
    }
    if (panelY + 100 > height - 20) {
      panelY = height - 120;
    }
    if (panelY < 120) {
      panelY = 120;
    }
    
    const container = this.add.container(panelX, panelY);
    container.setDepth(1000);
    
    // Panel background
    const panelBg = this.add.rectangle(0, 0, 240, 100, 0x000000, 0.95);
    panelBg.setStrokeStyle(3, 0xFFD700);
    container.add(panelBg);
    
    // Level name
    const nameText = this.add.text(0, -30, level.name, {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      align: 'center',
      wordWrap: { width: 220 }
    });
    nameText.setOrigin(0.5);
    container.add(nameText);
    
    // Description
    const descText = this.add.text(0, 5, level.desc, {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#CCCCCC',
      align: 'center',
      wordWrap: { width: 220 }
    });
    descText.setOrigin(0.5);
    container.add(descText);
    
    // Click to play hint
    const hintText = this.add.text(0, 35, 'Click to start!', {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#AAAAAA',
      align: 'center',
    });
    hintText.setOrigin(0.5);
    container.add(hintText);
    
    // Fade in animation
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
    
    return container;
  }
  
  attemptMusicStart() {
    try {
      console.log('attemptMusicStart called for Roman campaign');
      
      // Only start if music is enabled
      if (!AudioManager.shouldPlayMusic()) {
        console.log('Music disabled by AudioManager');
        return;
      }
      
      console.log('Music enabled, proceeding...');
      
      // Stop any existing menu music from other scenes (with safety checks)
      try {
        const menuScene = this.scene.get('MenuScene');
        if (menuScene && menuScene.menuMusic && menuScene.menuMusic.isPlaying) {
          console.log('Stopping menu music');
          menuScene.menuMusic.stop();
        }
      } catch (e) {
        console.log('Could not stop menu music:', e);
      }
      
      // Stop Viking campaign music if playing (with safety checks)
      try {
        const vikingScene = this.scene.get('VikingCampaignScene');
        if (vikingScene && vikingScene.vikingMusic && vikingScene.vikingMusic.isPlaying) {
          console.log('Stopping Viking campaign music');
          vikingScene.vikingMusic.stop();
        }
      } catch (e) {
        console.log('Could not stop Viking music:', e);
      }
      
      // Stop Alien campaign music if playing (with safety checks)
      try {
        const alienScene = this.scene.get('AlienCampaignScene');
        if (alienScene && alienScene.alienMusic && alienScene.alienMusic.isPlaying) {
          console.log('Stopping Alien campaign music');
          alienScene.alienMusic.stop();
        }
      } catch (e) {
        console.log('Could not stop Alien music:', e);
      }
      
      // Create and play Roman music
      if (!this.romanMusic) {
        console.log('Creating Roman music object');
        
        // Check if the audio was loaded successfully
        if (!this.cache.audio.exists('roman-music')) {
          console.warn('Roman music audio not loaded, skipping music');
          return;
        }
        
        this.romanMusic = this.sound.add('roman-music', {
          loop: true,
          volume: AudioManager.getEffectiveVolume('music')
        });
        
        // Add event listeners for debugging
        this.romanMusic.once('play', () => {
          console.log('Roman music started playing!');
          this.musicStarted = true;
        });
        
        this.romanMusic.once('looped', () => {
          console.log('Roman music looped');
        });
        
        this.romanMusic.once('error', (error) => {
          console.error('Roman music error:', error);
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
            if (this.romanMusic) {
              this.romanMusic.play();
            }
          }).catch(err => {
            console.error('Failed to resume audio context:', err);
          });
        } else {
          console.log('Playing music directly (context already running)');
          if (this.romanMusic) {
            this.romanMusic.play();
          }
        }
      } else {
        console.warn('No sound context available, skipping music');
      }
      
      // Add music watchdog - check every 3 seconds (only once)
      if (!this.musicWatchdog) {
        this.musicWatchdog = this.time.addEvent({
          delay: 3000,
          callback: () => {
            if (AudioManager.shouldPlayMusic()) {
              if (!this.romanMusic || !this.romanMusic.isPlaying) {
                console.log('Roman music not playing, current state:', this.romanMusic ? this.romanMusic.isPlaying : 'no music object');
              }
            }
          },
          loop: true
        });
      }
    } catch (error) {
      console.error('Error in attemptMusicStart:', error);
      // Don't let music errors break the scene
    }
  }
  
  stopRomanMusic() {
    console.log('Stopping Roman music');
    
    // Stop watchdog
    if (this.musicWatchdog) {
      this.musicWatchdog.remove();
      this.musicWatchdog = null;
    }
    
    if (this.romanMusic && this.romanMusic.isPlaying) {
      // Fade out before stopping
      this.tweens.add({
        targets: this.romanMusic,
        volume: 0,
        duration: 500,
        ease: 'Linear',
        onComplete: () => {
          if (this.romanMusic) {
            this.romanMusic.stop();
            this.romanMusic.destroy();
            this.romanMusic = null;
          }
        }
      });
    } else if (this.romanMusic) {
      this.romanMusic.destroy();
      this.romanMusic = null;
    }
  }
  
  createBackButton(x, y) {
    const button = this.add.rectangle(x, y, 200, 50, 0x8B4513);
    button.setStrokeStyle(3, 0xFFD700);
    button.setInteractive({ useHandCursor: true });
    
    const text = this.add.text(x, y, 'BACK', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setFillStyle(0xA0522D);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x8B4513);
    });
    
    button.on('pointerdown', () => {
      this.stopRomanMusic();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }
  
  createResetButton(x, y) {
    const button = this.add.rectangle(x, y, 200, 50, 0xCC0000);
    button.setStrokeStyle(3, 0xFF0000);
    button.setInteractive({ useHandCursor: true });
    
    const text = this.add.text(x, y, 'RESET', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setFillStyle(0xFF0000);
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0xCC0000);
    });
    
    button.on('pointerdown', () => {
      localStorage.setItem('campaignProgress', '1');
      console.log('Progress reset to 1');
      this.buildUI();
    });
  }
  
  startLevel(levelNum) {
    console.log('Starting level', levelNum);
    // Stop Roman music before starting level
    this.stopRomanMusic();
    
    // Show comic dialogue intro before level - ORIGINAL CODE
    this.scene.start('ComicIntroScene', { levelNum });
  }
  
  shutdown() {
    // Clean up music when scene shuts down
    this.stopRomanMusic();
  }
}
