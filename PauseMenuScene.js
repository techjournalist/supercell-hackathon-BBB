import Phaser from 'phaser';
import { soundEffects } from './SoundEffectsManager.js';

export class PauseMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PauseMenuScene' });
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Semi-transparent overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7);
    overlay.setScrollFactor(0);
    overlay.setDepth(200);
    
    // Menu panel
    const panel = this.add.rectangle(width / 2, height / 2, 400, 500, 0x1A1A2E);
    panel.setStrokeStyle(4, 0xFFD700);
    panel.setScrollFactor(0);
    panel.setDepth(200);
    
    // Title
    const title = this.add.text(width / 2, height / 2 - 180, 'PAUSED', {
      fontSize: '40px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(200);
    
    // Resume button
    const resumeButton = this.add.rectangle(width / 2, height / 2 - 50, 300, 60, 0x4CAF50);
    resumeButton.setStrokeStyle(3, 0xFFFFFF);
    resumeButton.setInteractive({ useHandCursor: true });
    resumeButton.setScrollFactor(0);
    resumeButton.setDepth(200);
    
    const resumeText = this.add.text(width / 2, height / 2 - 50, 'Resume', {
      fontSize: '24px',
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
    const mainMenuButton = this.add.rectangle(width / 2, height / 2 + 50, 300, 60, 0x2196F3);
    mainMenuButton.setStrokeStyle(3, 0xFFFFFF);
    mainMenuButton.setInteractive({ useHandCursor: true });
    mainMenuButton.setScrollFactor(0);
    mainMenuButton.setDepth(200);
    
    const mainMenuText = this.add.text(width / 2, height / 2 + 50, 'Main Menu', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    mainMenuText.setOrigin(0.5);
    mainMenuText.setScrollFactor(0);
    mainMenuText.setDepth(200);
    
    mainMenuButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.scene.stop();
      this.scene.stop('GameScene');
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
    
    mainMenuButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      mainMenuButton.setFillStyle(0x42A5F5);
    });
    
    mainMenuButton.on('pointerout', () => {
      mainMenuButton.setFillStyle(0x2196F3);
    });
    
    // Audio Settings button
    const audioButton = this.add.rectangle(width / 2, height / 2 + 150, 300, 60, 0x9C27B0);
    audioButton.setStrokeStyle(3, 0xFFFFFF);
    audioButton.setInteractive({ useHandCursor: true });
    audioButton.setScrollFactor(0);
    audioButton.setDepth(200);
    
    const audioText = this.add.text(width / 2, height / 2 + 150, '🔊 Audio Settings', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    audioText.setOrigin(0.5);
    audioText.setScrollFactor(0);
    audioText.setDepth(200);
    
    audioButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      // Launch audio settings as overlay
      this.scene.launch('AudioSettingsScene', { callingScene: 'PauseMenuScene' });
    });
    
    audioButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      audioButton.setFillStyle(0xAB47BC);
    });
    
    audioButton.on('pointerout', () => {
      audioButton.setFillStyle(0x9C27B0);
    });
    
    // ESC key to resume
    this.input.keyboard.once('keydown-ESC', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }
}
