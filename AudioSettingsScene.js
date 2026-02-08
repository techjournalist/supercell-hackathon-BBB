import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { soundEffects } from './SoundEffectsManager.js';

/**
 * AudioSettingsScene - Global audio settings menu
 * Can be launched as an overlay from any scene
 */
export class AudioSettingsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AudioSettingsScene' });
  }
  
  create(data) {
    const { width, height } = this.scale;
    
    // Store the scene that called us
    this.callingScene = data.callingScene || 'MenuScene';
    
    // Semi-transparent overlay background
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0);
    overlay.setInteractive();
    overlay.setDepth(1000);
    
    // Main settings panel
    const panelWidth = Math.min(600, width * 0.9);
    const panelHeight = Math.min(500, height * 0.8);
    const panelX = width / 2;
    const panelY = height / 2;
    
    const panel = this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x1a1a2e, 0.95);
    panel.setStrokeStyle(4, 0x16213e);
    panel.setDepth(1001);
    
    // Decorative header bar
    const headerBar = this.add.rectangle(panelX, panelY - panelHeight/2 + 40, panelWidth, 80, 0x0f3460);
    headerBar.setDepth(1001);
    
    // Title
    const title = this.add.text(panelX, panelY - panelHeight/2 + 40, 'AUDIO SETTINGS', {
      fontSize: '32px',
      fontFamily: 'Press Start 2P',
      color: '#e94560',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(1002);
    
    // Subtitle
    const subtitle = this.add.text(panelX, panelY - panelHeight/2 + 75, 'Adjust music and sound effects', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#aaaaaa',
    });
    subtitle.setOrigin(0.5);
    subtitle.setDepth(1002);
    
    // Settings content area starts here
    const contentStartY = panelY - panelHeight/2 + 120;
    let currentY = contentStartY;
    
    // Get current settings
    const musicVolume = AudioManager.volumes.music;
    const sfxVolume = AudioManager.volumes.sfx;
    const musicMuted = AudioManager.muted.music;
    const sfxMuted = AudioManager.muted.sfx;
    
    // MUSIC VOLUME SECTION
    currentY += 20;
    
    const musicLabel = this.add.text(panelX - panelWidth/2 + 40, currentY, '🎵 MUSIC VOLUME', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#00d4ff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    musicLabel.setDepth(1002);
    
    currentY += 40;
    
    // Music volume slider
    const sliderWidth = panelWidth - 120;
    const sliderHeight = 20;
    const sliderX = panelX - sliderWidth/2;
    
    this.createVolumeSlider(
      sliderX,
      currentY,
      sliderWidth,
      sliderHeight,
      musicVolume,
      'music',
      (value) => {
        AudioManager.setVolume('music', value);
        this.updateMusicVolumeDisplay(value);
      }
    );
    
    // Music volume percentage display
    this.musicVolumeText = this.add.text(panelX + panelWidth/2 - 70, currentY, `${Math.round(musicVolume * 100)}%`, {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.musicVolumeText.setOrigin(0, 0.5);
    this.musicVolumeText.setDepth(1002);
    
    currentY += 40;
    
    // Music mute toggle
    this.createToggleButton(
      panelX,
      currentY,
      'Mute Music',
      musicMuted,
      (muted) => {
        AudioManager.toggleMute('music');
        soundEffects.playButtonClick();
      }
    );
    
    currentY += 80;
    
    // SOUND EFFECTS VOLUME SECTION
    const sfxLabel = this.add.text(panelX - panelWidth/2 + 40, currentY, '🔊 SOUND EFFECTS VOLUME', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#00d4ff',
      stroke: '#000000',
      strokeThickness: 3,
    });
    sfxLabel.setDepth(1002);
    
    currentY += 40;
    
    // SFX volume slider
    this.createVolumeSlider(
      sliderX,
      currentY,
      sliderWidth,
      sliderHeight,
      sfxVolume,
      'sfx',
      (value) => {
        AudioManager.setVolume('sfx', value);
        soundEffects.updateVolume();
        this.updateSfxVolumeDisplay(value);
        
        // Play test sound
        soundEffects.playButtonClick();
      }
    );
    
    // SFX volume percentage display
    this.sfxVolumeText = this.add.text(panelX + panelWidth/2 - 70, currentY, `${Math.round(sfxVolume * 100)}%`, {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.sfxVolumeText.setOrigin(0, 0.5);
    this.sfxVolumeText.setDepth(1002);
    
    currentY += 40;
    
    // SFX mute toggle
    this.createToggleButton(
      panelX,
      currentY,
      'Mute Sound Effects',
      sfxMuted,
      (muted) => {
        AudioManager.toggleMute('sfx');
        soundEffects.updateVolume();
        if (!muted) {
          soundEffects.playButtonClick();
        }
      }
    );
    
    // CLOSE BUTTON
    const closeButton = this.add.rectangle(panelX, panelY + panelHeight/2 - 50, 200, 50, 0xe94560);
    closeButton.setStrokeStyle(3, 0xff6b6b);
    closeButton.setInteractive({ useHandCursor: true });
    closeButton.setDepth(1002);
    
    const closeText = this.add.text(panelX, panelY + panelHeight/2 - 50, 'CLOSE', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#ffffff',
    });
    closeText.setOrigin(0.5);
    closeText.setDepth(1003);
    
    closeButton.on('pointerover', () => {
      closeButton.setFillStyle(0xff6b6b);
      soundEffects.playButtonHover();
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setFillStyle(0xe94560);
    });
    
    closeButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.closeMenu();
    });
    
    // ESC key to close
    this.input.keyboard.once('keydown-ESC', () => {
      this.closeMenu();
    });
  }
  
  createVolumeSlider(x, y, width, height, initialValue, type, onChange) {
    // Slider track background
    const track = this.add.rectangle(x + width/2, y, width, height, 0x333333);
    track.setOrigin(0.5);
    track.setDepth(1001);
    
    // Slider fill (shows current volume)
    const fill = this.add.rectangle(x + (width * initialValue) / 2, y, width * initialValue, height, 0x00d4ff);
    fill.setOrigin(0.5);
    fill.setDepth(1001);
    
    // Slider handle
    const handleSize = 30;
    const handle = this.add.circle(x + width * initialValue, y, handleSize / 2, 0xffffff);
    handle.setStrokeStyle(3, 0x00d4ff);
    handle.setInteractive({ useHandCursor: true, draggable: true });
    handle.setDepth(1002);
    
    // Store references
    if (type === 'music') {
      this.musicSlider = { track, fill, handle, width, x, y, onChange };
    } else {
      this.sfxSlider = { track, fill, handle, width, x, y, onChange };
    }
    
    // Drag handler
    handle.on('drag', (pointer, dragX, dragY) => {
      // Clamp handle position to slider bounds
      const clampedX = Phaser.Math.Clamp(dragX, x, x + width);
      handle.x = clampedX;
      
      // Calculate volume (0 to 1)
      const value = (clampedX - x) / width;
      
      // Update fill
      fill.x = x + (width * value) / 2;
      fill.width = width * value;
      
      // Callback with new value
      onChange(value);
    });
    
    // Click on track to jump to position
    track.setInteractive({ useHandCursor: true });
    track.on('pointerdown', (pointer) => {
      const localX = pointer.x - x;
      const value = Phaser.Math.Clamp(localX / width, 0, 1);
      
      handle.x = x + width * value;
      fill.x = x + (width * value) / 2;
      fill.width = width * value;
      
      onChange(value);
      soundEffects.playButtonClick();
    });
    
    // Hover effect on handle
    handle.on('pointerover', () => {
      handle.setScale(1.2);
      soundEffects.playButtonHover();
    });
    
    handle.on('pointerout', () => {
      handle.setScale(1);
    });
  }
  
  createToggleButton(x, y, label, initialState, onToggle) {
    const buttonWidth = 280;
    const buttonHeight = 50;
    
    const button = this.add.rectangle(x, y, buttonWidth, buttonHeight, initialState ? 0x4CAF50 : 0x666666);
    button.setStrokeStyle(3, initialState ? 0x66BB6A : 0x888888);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(1002);
    
    const buttonText = this.add.text(x, y, label + (initialState ? ': ON' : ': OFF'), {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#ffffff',
    });
    buttonText.setOrigin(0.5);
    buttonText.setDepth(1003);
    
    let isToggled = initialState;
    
    button.on('pointerover', () => {
      button.setFillStyle(isToggled ? 0x66BB6A : 0x888888);
      soundEffects.playButtonHover();
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(isToggled ? 0x4CAF50 : 0x666666);
    });
    
    button.on('pointerdown', () => {
      isToggled = !isToggled;
      button.setFillStyle(isToggled ? 0x4CAF50 : 0x666666);
      button.setStrokeStyle(3, isToggled ? 0x66BB6A : 0x888888);
      buttonText.setText(label + (isToggled ? ': ON' : ': OFF'));
      onToggle(isToggled);
    });
  }
  
  updateMusicVolumeDisplay(value) {
    if (this.musicVolumeText) {
      this.musicVolumeText.setText(`${Math.round(value * 100)}%`);
    }
  }
  
  updateSfxVolumeDisplay(value) {
    if (this.sfxVolumeText) {
      this.sfxVolumeText.setText(`${Math.round(value * 100)}%`);
    }
  }
  
  closeMenu() {
    // Return to calling scene
    this.scene.stop();
    
    // Resume the calling scene if it was paused
    if (this.scene.isActive(this.callingScene)) {
      this.scene.resume(this.callingScene);
    }
  }
}
