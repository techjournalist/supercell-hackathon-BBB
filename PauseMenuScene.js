import Phaser from 'phaser';
import { soundEffects } from './SoundEffectsManager.js';

export class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseMenuScene' });
  }
  
  create() {
    const { width, height } = this.scale;

    const panelW = Math.min(400, width * 0.88);
    const panelH = Math.min(520, height * 0.88);
    const btnW = Math.min(300, panelW - 40);
    const btnH = Math.min(56, panelH * 0.1);
    const titleFontSize = Math.max(20, Math.min(40, width * 0.04));
    const btnFontSize = Math.max(12, Math.min(22, width * 0.022));
    const btnSpacing = Math.max(14, panelH * 0.14);

    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    overlay.setDepth(200);

    // Menu panel
    const panel = this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x1A1A2E);
    panel.setStrokeStyle(4, 0xFFD700);
    panel.setScrollFactor(0);
    panel.setDepth(200);

    // Title
    const title = this.add.text(width / 2, height / 2 - panelH * 0.4, 'PAUSED', {
      fontSize: `${titleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(200);

    const startY = height / 2 - panelH * 0.2;

    // Resume button
    const resumeButton = this.add.rectangle(width / 2, startY, btnW, btnH, 0x4CAF50);
    resumeButton.setStrokeStyle(3, 0xFFFFFF);
    resumeButton.setInteractive({ useHandCursor: true });
    resumeButton.setScrollFactor(0);
    resumeButton.setDepth(200);

    const resumeText = this.add.text(width / 2, startY, 'Resume', {
      fontSize: `${btnFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    resumeText.setOrigin(0.5);
    resumeText.setScrollFactor(0);
    resumeText.setDepth(200);

    resumeButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.scene.stop();
      this.scene.resume('GameScene');
    });
    resumeButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      resumeButton.setFillStyle(0x66BB6A);
    });
    resumeButton.on('pointerout', () => {
      resumeButton.setFillStyle(0x4CAF50);
    });

    // Main Menu button
    const mainMenuButton = this.add.rectangle(width / 2, startY + btnSpacing, btnW, btnH, 0x2196F3);
    mainMenuButton.setStrokeStyle(3, 0xFFFFFF);
    mainMenuButton.setInteractive({ useHandCursor: true });
    mainMenuButton.setScrollFactor(0);
    mainMenuButton.setDepth(200);

    const mainMenuText = this.add.text(width / 2, startY + btnSpacing, 'Main Menu', {
      fontSize: `${btnFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    mainMenuText.setOrigin(0.5);
    mainMenuText.setScrollFactor(0);
    mainMenuText.setDepth(200);

    mainMenuButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.scene.stop('GameScene');
      this.scene.start('MenuScene');
    });
    mainMenuButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      mainMenuButton.setFillStyle(0x42A5F5);
    });
    mainMenuButton.on('pointerout', () => {
      mainMenuButton.setFillStyle(0x2196F3);
    });

    // Audio Settings button
    const audioButton = this.add.rectangle(width / 2, startY + btnSpacing * 2, btnW, btnH, 0x1a5276);
    audioButton.setStrokeStyle(3, 0xFFFFFF);
    audioButton.setInteractive({ useHandCursor: true });
    audioButton.setScrollFactor(0);
    audioButton.setDepth(200);

    const audioText = this.add.text(width / 2, startY + btnSpacing * 2, 'Audio Settings', {
      fontSize: `${Math.max(10, btnFontSize - 2)}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    audioText.setOrigin(0.5);
    audioText.setScrollFactor(0);
    audioText.setDepth(200);

    audioButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.scene.launch('AudioSettingsScene', { callingScene: 'PauseMenuScene' });
    });
    audioButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      audioButton.setFillStyle(0x2874a6);
    });
    audioButton.on('pointerout', () => {
      audioButton.setFillStyle(0x1a5276);
    });

    // Quit button
    const quitButton = this.add.rectangle(width / 2, startY + btnSpacing * 3, btnW, btnH, 0x4A1010);
    quitButton.setStrokeStyle(3, 0xCC4433);
    quitButton.setInteractive({ useHandCursor: true });
    quitButton.setScrollFactor(0);
    quitButton.setDepth(200);

    const quitText = this.add.text(width / 2, startY + btnSpacing * 3, 'Quit Game', {
      fontSize: `${btnFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#CC4433',
    });
    quitText.setOrigin(0.5);
    quitText.setScrollFactor(0);
    quitText.setDepth(200);

    quitButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      if (confirm('Close the game? This will close the tab.')) {
        window.open('about:blank', '_self');
        window.close();
      }
    });
    quitButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      quitButton.setFillStyle(0x6A1010);
    });
    quitButton.on('pointerout', () => {
      quitButton.setFillStyle(0x4A1010);
    });

    // ESC key to resume
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }
}
