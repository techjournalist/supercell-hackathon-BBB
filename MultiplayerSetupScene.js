import Phaser from 'phaser';

export class MultiplayerSetupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerSetupScene' });
  }
  
  preload() {
    // Load menu background
    this.load.image('menu-bg', 'https://rosebud.ai/assets/menu-screen.jpeg?D4E2');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Player selections
    this.player1Faction = null;
    this.player2Faction = null;
    
    // Background image
    const bg = this.add.image(width / 2, 0, 'menu-bg');
    bg.setOrigin(0.5, 0);
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Dark overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);
    
    // Title
    const title = this.add.text(width / 2, 80, 'LOCAL MULTIPLAYER', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Subtitle
    const subtitle = this.add.text(width / 2, 140, 'Each player selects a faction', {
      fontSize: '20px',
      fontFamily: 'Arial',
      color: '#CCCCCC',
    });
    subtitle.setOrigin(0.5);
    
    // Player 1 section (top half)
    this.createPlayerSection(1, width / 2, height * 0.35);
    
    // Player 2 section (bottom half)
    this.createPlayerSection(2, width / 2, height * 0.65);
    
    // Start button (initially disabled)
    this.createStartButton(width / 2, height - 80);
    
    // Back button
    this.createBackButton(100, height - 80);
  }
  
  createPlayerSection(playerNum, centerX, centerY) {
    const sectionColor = playerNum === 1 ? 0x3344AA : 0xAA3344;
    
    // Section title
    const playerText = this.add.text(centerX, centerY - 80, `PLAYER ${playerNum}`, {
      fontSize: '32px',
      fontFamily: 'Press Start 2P',
      color: playerNum === 1 ? '#4488FF' : '#FF4488',
      stroke: '#000000',
      strokeThickness: 4,
    });
    playerText.setOrigin(0.5);
    
    // Selection status
    const statusText = this.add.text(centerX, centerY - 40, 'Choose your faction:', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
    });
    statusText.setOrigin(0.5);
    
    // Store for updating
    if (playerNum === 1) {
      this.player1StatusText = statusText;
    } else {
      this.player2StatusText = statusText;
    }
    
    // Romans button
    const romansX = centerX - 250;
    const romansButton = this.add.rectangle(romansX, centerY + 40, 160, 120, 0x8B4513);
    romansButton.setInteractive({ useHandCursor: true });
    romansButton.setStrokeStyle(3, 0xFFD700);
    
    const romansIcon = this.add.text(romansX, centerY + 20, '🛡️', {
      fontSize: '48px',
    });
    romansIcon.setOrigin(0.5);
    
    const romansLabel = this.add.text(romansX, centerY + 70, 'ROMANS', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    romansLabel.setOrigin(0.5);
    
    // Vikings button
    const vikingsX = centerX;
    const vikingsButton = this.add.rectangle(vikingsX, centerY + 40, 160, 120, 0x4A7BA7);
    vikingsButton.setInteractive({ useHandCursor: true });
    vikingsButton.setStrokeStyle(3, 0x87CEEB);
    
    const vikingsIcon = this.add.text(vikingsX, centerY + 20, '⚔️', {
      fontSize: '48px',
    });
    vikingsIcon.setOrigin(0.5);
    
    const vikingsLabel = this.add.text(vikingsX, centerY + 70, 'VIKINGS', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#87CEEB',
    });
    vikingsLabel.setOrigin(0.5);
    
    // Aliens button
    const aliensX = centerX + 250;
    const aliensButton = this.add.rectangle(aliensX, centerY + 40, 160, 120, 0x4A148C);
    aliensButton.setInteractive({ useHandCursor: true });
    aliensButton.setStrokeStyle(3, 0x00FF00);
    
    const aliensIcon = this.add.text(aliensX, centerY + 20, '👽', {
      fontSize: '48px',
    });
    aliensIcon.setOrigin(0.5);
    
    const aliensLabel = this.add.text(aliensX, centerY + 70, 'ALIENS', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#00FF00',
    });
    aliensLabel.setOrigin(0.5);
    
    // Button interactions - Romans
    romansButton.on('pointerover', () => {
      romansButton.setFillStyle(0xA0522D);
    });
    
    romansButton.on('pointerout', () => {
      romansButton.setFillStyle(0x8B4513);
    });
    
    romansButton.on('pointerdown', () => {
      if (playerNum === 1) {
        this.player1Faction = 'roman';
        this.player1StatusText.setText('Selected: Romans 🛡️');
        this.player1StatusText.setColor('#FFD700');
      } else {
        this.player2Faction = 'roman';
        this.player2StatusText.setText('Selected: Romans 🛡️');
        this.player2StatusText.setColor('#FFD700');
      }
      this.updateStartButton();
    });
    
    // Button interactions - Vikings
    vikingsButton.on('pointerover', () => {
      vikingsButton.setFillStyle(0x6A9BC7);
    });
    
    vikingsButton.on('pointerout', () => {
      vikingsButton.setFillStyle(0x4A7BA7);
    });
    
    vikingsButton.on('pointerdown', () => {
      if (playerNum === 1) {
        this.player1Faction = 'viking';
        this.player1StatusText.setText('Selected: Vikings ⚔️');
        this.player1StatusText.setColor('#87CEEB');
      } else {
        this.player2Faction = 'viking';
        this.player2StatusText.setText('Selected: Vikings ⚔️');
        this.player2StatusText.setColor('#87CEEB');
      }
      this.updateStartButton();
    });
    
    // Button interactions - Aliens
    aliensButton.on('pointerover', () => {
      aliensButton.setFillStyle(0x6A1A8C);
    });
    
    aliensButton.on('pointerout', () => {
      aliensButton.setFillStyle(0x4A148C);
    });
    
    aliensButton.on('pointerdown', () => {
      if (playerNum === 1) {
        this.player1Faction = 'alien';
        this.player1StatusText.setText('Selected: Aliens 👽');
        this.player1StatusText.setColor('#00FF00');
      } else {
        this.player2Faction = 'alien';
        this.player2StatusText.setText('Selected: Aliens 👽');
        this.player2StatusText.setColor('#00FF00');
      }
      this.updateStartButton();
    });
  }
  
  createStartButton(x, y) {
    this.startButton = this.add.rectangle(x, y, 300, 60, 0x555555);
    this.startButton.setStrokeStyle(4, 0xFFFFFF);
    this.startButton.setAlpha(0.5);
    
    this.startButtonText = this.add.text(x, y, 'START MATCH', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#888888',
    });
    this.startButtonText.setOrigin(0.5);
  }
  
  updateStartButton() {
    if (this.player1Faction && this.player2Faction) {
      // Enable start button
      this.startButton.setInteractive({ useHandCursor: true });
      this.startButton.setFillStyle(0x00AA00);
      this.startButton.setAlpha(1);
      this.startButtonText.setColor('#FFFFFF');
      
      this.startButton.on('pointerover', () => {
        this.startButton.setFillStyle(0x00DD00);
      });
      
      this.startButton.on('pointerout', () => {
        this.startButton.setFillStyle(0x00AA00);
      });
      
      this.startButton.on('pointerdown', () => {
        this.startMultiplayer();
      });
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
      this.scene.start('MenuScene');
    });
  }
  
  startMultiplayer() {
    // Store selections in registry
    this.registry.set('multiplayerMode', true);
    this.registry.set('player1Faction', this.player1Faction);
    this.registry.set('player2Faction', this.player2Faction);
    
    // Transition to game
    this.cameras.main.fade(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start('MultiplayerGameScene');
    });
  }
}
