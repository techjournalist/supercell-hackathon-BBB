import Phaser from 'phaser';

export class MultiplayerVictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerVictoryScene' });
  }
  
  preload() {
    // Load menu background
    this.load.image('menu-bg', 'https://rosebud.ai/assets/menu-screen.jpeg?D4E2');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Get winner and stats
    const winnerNum = this.registry.get('multiplayerWinner');
    const stats = this.registry.get('multiplayerStats');
    
    // Background image
    const bg = this.add.image(width / 2, 0, 'menu-bg');
    bg.setOrigin(0.5, 0);
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Darker overlay for victory screen
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6);
    overlay.setOrigin(0);
    
    // Victory text
    const winnerColor = winnerNum === 1 ? '#4488FF' : '#FF4488';
    const winnerText = this.add.text(width / 2, height * 0.25, `PLAYER ${winnerNum} WINS!`, {
      fontSize: '64px',
      fontFamily: 'Press Start 2P',
      color: winnerColor,
      stroke: '#000000',
      strokeThickness: 8,
    });
    winnerText.setOrigin(0.5);
    
    // Animate victory text
    this.tweens.add({
      targets: winnerText,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Trophy
    const trophy = this.add.text(width / 2, height * 0.4, '🏆', {
      fontSize: '80px',
    });
    trophy.setOrigin(0.5);
    
    // Stats panel
    const panelY = height * 0.55;
    const statsText = this.add.text(width / 2, panelY, 
      `GAME STATS\n\n` +
      `Time: ${Math.floor(stats.gameTime / 60)}:${(stats.gameTime % 60).toString().padStart(2, '0')}\n\n` +
      `Player 1: ${stats.p1Units} units, ${stats.p1Gold} gold\n` +
      `Player 2: ${stats.p2Units} units, ${stats.p2Gold} gold`,
      {
        fontSize: '16px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        align: 'center',
        lineSpacing: 8,
      }
    );
    statsText.setOrigin(0.5);
    
    // Buttons
    const buttonY = height * 0.8;
    
    // Rematch button
    this.createButton(width / 2 - 150, buttonY, 250, 60, 'REMATCH', () => {
      this.scene.start('MultiplayerSetupScene');
    });
    
    // Main menu button
    this.createButton(width / 2 + 150, buttonY, 250, 60, 'MAIN MENU', () => {
      this.scene.start('MenuScene');
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
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x8B4513);
    });
    
    button.on('pointerdown', callback);
  }
}
