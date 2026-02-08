import Phaser from 'phaser';

export class DefeatScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DefeatScene' });
  }
  
  preload() {
    // Load defeat background
    this.load.image('defeat-bg', 'https://rosebud.ai/assets/defeat-screen.jpeg?xLg7');
  }
  
  create(data) {
    const { width, height } = this.scale;
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Check if challenge mode (especially endless)
    const challengeMode = data.challengeMode;
    const challengeScore = data.challengeScore;
    
    // Defeat background image
    const bg = this.add.image(width / 2, height / 2, 'defeat-bg');
    bg.setDisplaySize(width, height);
    
    // Add semi-transparent overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.35);
    overlay.setOrigin(0);
    
    // Add dark particles
    this.createDefeatParticles(width, height);
    
    // Defeat banner with ominous glow (semi-transparent to show background)
    const banner = this.add.rectangle(width / 2, 150, width * 0.9, 150, 0xF44336, 0.7);
    banner.setStrokeStyle(5, 0x8B0000);
    
    this.tweens.add({
      targets: banner,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    const defeatText = this.add.text(width / 2, 150, 'DEFEAT', {
      fontSize: '72px',
      fontFamily: 'Press Start 2P',
      color: '#8B0000',
      stroke: '#000000',
      strokeThickness: 8,
    });
    defeatText.setOrigin(0.5);
    
    // Pulse animation
    this.tweens.add({
      targets: defeatText,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add warning icons
    const leftIcon = this.add.text(width / 2 - 300, 150, '☠️', { fontSize: '80px' });
    leftIcon.setOrigin(0.5);
    const rightIcon = this.add.text(width / 2 + 300, 150, '☠️', { fontSize: '80px' });
    rightIcon.setOrigin(0.5);
    
    this.tweens.add({
      targets: [leftIcon, rightIcon],
      y: 140,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Stats panel
    const statsY = 300;
    const stats = data.stats || {
      unitsTrained: 0,
      goldEarned: 0,
      timeElapsed: 0,
      spellsCast: 0
    };
    
    const statsPanel = this.add.rectangle(width / 2, statsY + 120, 500, 300, 0x2C2416, 0.85);
    statsPanel.setStrokeStyle(4, 0x8B0000);
    
    const statsTitle = this.add.text(width / 2, statsY, 
      challengeMode === 'endless' ? 'FINAL STATS' : 'BATTLE STATISTICS', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#F44336',
    });
    statsTitle.setOrigin(0.5);
    
    const statsText = [
      `Units Trained: ${stats.unitsTrained}`,
      `Gold Earned: ${stats.goldEarned}`,
      `Time: ${this.formatTime(stats.timeElapsed)}`,
      `Spells Cast: ${stats.spellsCast}`
    ];
    
    let statY = statsY + 60;
    statsText.forEach(stat => {
      const text = this.add.text(width / 2, statY, stat, {
        fontSize: '18px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
      });
      text.setOrigin(0.5);
      statY += 50;
    });
    
    // Buttons
    const buttonY = height - 150;
    
    const skirmishDifficulty = this.registry.get('skirmishDifficulty');
    
    // Retry button
    if (skirmishDifficulty) {
      this.createButton(width / 2 - 150, buttonY, 250, 60, 'RETRY', () => {
        this.startTransition('GameScene');
      });
    } else {
      this.createButton(width / 2 - 150, buttonY, 250, 60, 'RETRY', () => {
        this.startTransition('GameScene');
      });
    }
    
    // Main Menu button
    this.createButton(width / 2 + 150, buttonY, 250, 60, 'MAIN MENU', () => {
      if (skirmishDifficulty) {
        this.registry.set('skirmishDifficulty', null);
      }
      this.startTransition('MenuScene');
    });
  }
  
  createButton(x, y, width, height, text, callback) {
    const button = this.add.rectangle(x, y, width, height, 0x8B4513);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(4, 0xFFD700);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    buttonText.setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setFillStyle(0xA0522D);
      this.tweens.add({
        targets: button,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x8B4513);
      this.tweens.add({
        targets: button,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });
    
    button.on('pointerdown', callback);
  }
  
  createDefeatParticles(width, height) {
    // Create dark/red particles falling
    this.time.addEvent({
      delay: 300,
      callback: () => {
        for (let i = 0; i < 2; i++) {
          const x = Math.random() * width;
          const y = 0;
          const colors = [0x8B0000, 0xF44336, 0x4A0000];
          const particle = this.add.circle(x, y, 4, colors[Math.floor(Math.random() * colors.length)]);
          
          this.tweens.add({
            targets: particle,
            y: height,
            x: x + (Math.random() - 0.5) * 100,
            alpha: 0,
            duration: 3000 + Math.random() * 2000,
            ease: 'Power2',
            onComplete: () => particle.destroy()
          });
        }
      },
      loop: true
    });
  }
  
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  startTransition(nextScene) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(nextScene);
    });
  }
}
