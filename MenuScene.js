import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { soundEffects } from './SoundEffectsManager.js';
import { MusicManager } from './MusicManager.js';
import { ProfileManager } from './ProfileManager.js';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  preload() {
    this.load.on('loaderror', (file) => {
      console.warn(`Asset failed to load: ${file.key} (${file.url})`);
    });

    this.load.image('menu-bg', 'https://rosebud.ai/assets/menu-screen.jpeg?D4E2');
  }

  init() {
    this._transitioning = false;
  }

  create() {
    const { width, height } = this.scale;

    if (AudioManager.shouldPlayMusic()) {
      MusicManager.play('menu-theme');
    }

    this.input.once('pointerdown', () => {
      MusicManager.tryUnlock();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('menu-theme');
      }
    });
    
    // Full-screen background image
    const bg = this.add.image(width / 2, 0, 'menu-bg');
    bg.setOrigin(0.5, 0); // Center horizontally, align to top
    
    // Scale to cover the screen while maintaining aspect ratio
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Dark gradient overlay at bottom for readability (starts at 55%)
    const gradientHeight = height * 0.55;
    const gradient = this.add.graphics();
    gradient.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.75, 0.75);
    gradient.fillRect(0, height - gradientHeight, width, gradientHeight);
    
    // Button container positioning - anchored to bottom with responsive sizing
    // min(360px, 85vw)
    const buttonMaxWidth = Math.min(360, width * 0.85);
    const buttonWidth = Math.min(buttonMaxWidth, width * 0.9);
    // clamp(15px, 3vh, 35px)
    const containerBottomPadding = Math.max(15, Math.min(height * 0.03, 35));
    
    // Calculate total height needed for all buttons with responsive sizing
    const campaignButtonHeight = 36;
    const secondaryButtonHeight = 34;
    const campaignGap = 4;
    const secondaryGap = 6;
    const labelHeight = 20;
    const panelPadding = 8;
    
    const totalHeight =
      labelHeight + // "CAMPAIGNS" label
      5 + // margin-bottom of label
      panelPadding + // top padding
      (campaignButtonHeight * 3) + (campaignGap * 2) + // campaign buttons
      panelPadding + // bottom padding
      12 + // gap after panel
      (secondaryButtonHeight * 3) + (secondaryGap * 2) + // secondary buttons
      10 + // gap before leaderboard link
      20 + // leaderboard link height
      24 + // friends link
      24; // quit game link
    
    // Start from bottom and work upwards
    let currentY = height - containerBottomPadding - totalHeight;
    
    // "CAMPAIGNS" section label with responsive font size: clamp(9px, 1.2vw, 12px)
    const labelFontSize = Math.max(9, Math.min(width * 0.012, 12));
    const campaignsLabel = this.add.text(width / 2, currentY, '— CAMPAIGNS —', {
      fontSize: `${labelFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#c9941a',
      letterSpacing: 3,
    });
    campaignsLabel.setOrigin(0.5);
    currentY += 20;
    
    // Campaign buttons container with background panel
    const campaignPanel = this.add.graphics();
    const panelWidth = buttonWidth + 16;
    const panelHeight = (campaignButtonHeight * 3) + (campaignGap * 2) + (panelPadding * 2);
    campaignPanel.fillStyle(0x0a050f, 0.6);
    campaignPanel.lineStyle(1, 0xc9941a, 0.3);
    campaignPanel.fillRoundedRect(width / 2 - panelWidth / 2, currentY, panelWidth, panelHeight, 8);
    campaignPanel.strokeRoundedRect(width / 2 - panelWidth / 2, currentY, panelWidth, panelHeight, 8);
    
    currentY += panelPadding + (campaignButtonHeight / 2);
    
    // Campaign buttons (4px gap)
    this.createStyledButton(width / 2, currentY, buttonWidth, 'ROMAN CAMPAIGN', () => {
      this.startTransition('CampaignScene');
    }, false);
    currentY += campaignButtonHeight + campaignGap;
    
    this.createStyledButton(width / 2, currentY, buttonWidth, 'VIKING CAMPAIGN', () => {
      this.startTransition('VikingCampaignScene');
    }, false);
    currentY += campaignButtonHeight + campaignGap;
    
    this.createStyledButton(width / 2, currentY, buttonWidth, 'ALIEN CAMPAIGN', () => {
      this.startTransition('AlienCampaignScene');
    }, false);
    currentY += (campaignButtonHeight / 2) + panelPadding + 12;
    
    // Secondary buttons (more subtle, 6px gap)
    this.createStyledButton(width / 2, currentY, buttonWidth, 'CHALLENGE MODE', () => {
      this.startTransition('ChallengeMenuScene');
    }, true);
    currentY += secondaryButtonHeight + secondaryGap;
    
    this.createStyledButton(width / 2, currentY, buttonWidth, 'SKIRMISH', () => {
      this.startTransition('SkirmishSetupScene');
    }, true);
    currentY += secondaryButtonHeight + secondaryGap;
    
    this.createStyledButton(width / 2, currentY, buttonWidth, 'MULTIPLAYER', () => {
      this.startTransition('MultiplayerSetupScene');
    }, true);
    currentY += secondaryButtonHeight + 10;
    
    // Leaderboard as text link with responsive font size
    const linkFontSize = Math.max(10, Math.min(width * 0.012, 12));
    const leaderboardLink = this.add.text(width / 2, currentY, 'LEADERBOARD', {
      fontSize: `${linkFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#c9941a',
      letterSpacing: 2,
      fontStyle: 'bold',
    });
    leaderboardLink.setOrigin(0.5);
    leaderboardLink.setInteractive({ useHandCursor: true });
    
    leaderboardLink.on('pointerover', () => {
      leaderboardLink.setColor('#f0c040');
      leaderboardLink.setStyle({ textDecoration: 'underline' });
    });
    
    leaderboardLink.on('pointerout', () => {
      leaderboardLink.setColor('#c9941a');
      leaderboardLink.setStyle({ textDecoration: 'none' });
    });
    
    leaderboardLink.on('pointerdown', () => {
      this.startTransition('LeaderboardScene');
    });

    currentY += 24;
    const friendsLink = this.add.text(width / 2, currentY, 'FRIENDS', {
      fontSize: `${linkFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#44aa66',
      letterSpacing: 2,
      fontStyle: 'bold',
    });
    friendsLink.setOrigin(0.5);
    friendsLink.setInteractive({ useHandCursor: true });
    friendsLink.on('pointerover', () => friendsLink.setColor('#66ff88'));
    friendsLink.on('pointerout', () => friendsLink.setColor('#44aa66'));
    friendsLink.on('pointerdown', () => {
      this.startTransition('FriendsScene');
    });

    currentY += 24;
    const quitLink = this.add.text(width / 2, currentY, 'QUIT GAME', {
      fontSize: `${linkFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#5a3a2a',
      letterSpacing: 2,
      fontStyle: 'bold',
    });
    quitLink.setOrigin(0.5);
    quitLink.setInteractive({ useHandCursor: true });
    quitLink.on('pointerover', () => quitLink.setColor('#cc4433'));
    quitLink.on('pointerout', () => quitLink.setColor('#5a3a2a'));
    quitLink.on('pointerdown', () => {
      if (confirm('Close the game? This will close the tab.')) {
        window.open('about:blank', '_self');
        window.close();
      }
    });

    // Footer version text - absolute bottom with responsive font
    const footerFontSize = Math.max(9, Math.min(width * 0.01, 11));
    const footer = this.add.text(width / 2, height - 8, 'v0.1 Early Access', {
      fontSize: `${footerFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#ffffff',
      alpha: 0.3,
    });
    footer.setOrigin(0.5, 1);
    
    // Profile display in top-left corner
    const activeProfile = ProfileManager.getActive();
    const playerName = activeProfile ? activeProfile.name : (localStorage.getItem('playerName') || 'Player');
    const profileIcon = activeProfile ? ProfileManager.getIconChar(activeProfile.icon) : '⚔';
    const nameFontSize = Math.max(13, Math.min(width * 0.016, 16));

    const nameDisplay = this.add.text(16, 16, `${profileIcon} ${playerName}`, {
      fontSize: `${nameFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#c9941a',
      fontStyle: 'bold',
    });
    nameDisplay.setInteractive({ useHandCursor: true });

    nameDisplay.on('pointerover', () => nameDisplay.setColor('#f0c040'));
    nameDisplay.on('pointerout', () => nameDisplay.setColor('#c9941a'));
    nameDisplay.on('pointerdown', () => this.promptPlayerName());

    // Switch profile button below name
    const switchFontSize = Math.max(9, Math.min(width * 0.011, 11));
    const switchBtn = this.add.text(16, 16 + nameFontSize + 6, 'SWITCH PROFILE', {
      fontSize: `${switchFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#5a4a2a',
      letterSpacing: 1,
    });
    switchBtn.setInteractive({ useHandCursor: true });
    switchBtn.on('pointerover', () => switchBtn.setColor('#c9941a'));
    switchBtn.on('pointerout', () => switchBtn.setColor('#5a4a2a'));
    switchBtn.on('pointerdown', () => {
      soundEffects.playButtonClick && soundEffects.playButtonClick();
      MusicManager.stop();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ProfileSelectScene', { fromMenu: true });
      });
    });
    
    // Settings icon (gear) in top-right corner
    const settingsFontSize = Math.max(20, Math.min(width * 0.025, 28));
    const settingsIcon = this.add.text(width - 20, 20, '⚙️', {
      fontSize: `${settingsFontSize}px`,
    });
    settingsIcon.setOrigin(1, 0);
    settingsIcon.setInteractive({ useHandCursor: true });
    
    settingsIcon.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.showSettings();
    });
    
    settingsIcon.on('pointerover', () => {
      soundEffects.playButtonHover();
      settingsIcon.setScale(1.1);
    });
    
    settingsIcon.on('pointerout', () => {
      settingsIcon.setScale(1);
    });
  }
  
  showSettings() {
    this.scene.launch('AudioSettingsScene', { callingScene: 'MenuScene' });
  }

  
  promptPlayerName() {
    const currentName = localStorage.getItem('playerName') || 'Player';
    
    // Create overlay
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    overlay.setOrigin(0);
    overlay.setDepth(1000);
    
    // Dialog box - responsive sizing: min(500px, 90vw)
    const dialogWidth = Math.min(500, width * 0.9);
    const dialogHeight = Math.min(300, height * 0.85);
    const dialog = this.add.rectangle(width / 2, height / 2, dialogWidth, dialogHeight, 0x0a050f);
    dialog.setStrokeStyle(2, 0xc9941a);
    dialog.setDepth(1001);
    
    // Responsive font size: clamp(12px, 1.5vw, 20px)
    const dialogTitleFontSize = Math.max(12, Math.min(width * 0.015, 20));
    const title = this.add.text(width / 2, height / 2 - 80, 'ENTER YOUR NAME', {
      fontSize: `${dialogTitleFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#c9941a',
      fontStyle: 'bold',
      letterSpacing: 2,
    });
    title.setOrigin(0.5);
    title.setDepth(1001);
    
    const subtitle = this.add.text(width / 2, height / 2 - 40, 'This will appear on leaderboards', {
      fontSize: '14px',
      fontFamily: 'Arial',
      color: '#CCCCCC',
    });
    subtitle.setOrigin(0.5);
    subtitle.setDepth(1001);
    
    // Input box (simulated)
    const inputBox = this.add.rectangle(width / 2, height / 2 + 10, 400, 50, 0x000000);
    inputBox.setStrokeStyle(2, 0xc9941a);
    inputBox.setDepth(1001);
    
    let playerInput = currentName;
    const inputText = this.add.text(width / 2, height / 2 + 10, playerInput, {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    inputText.setOrigin(0.5);
    inputText.setDepth(1001);
    
    // Note about keyboard input
    const note = this.add.text(width / 2, height / 2 + 50, 'Note: Use browser prompt to change name\n(Click OK below)', {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: '#FFAA00',
      align: 'center',
    });
    note.setOrigin(0.5);
    note.setDepth(1001);
    
    // OK button
    const okButton = this.add.rectangle(width / 2 - 80, height / 2 + 100, 120, 50, 0x28190a);
    okButton.setStrokeStyle(2, 0xc9941a);
    okButton.setInteractive({ useHandCursor: true });
    okButton.setDepth(1001);
    
    const okText = this.add.text(width / 2 - 80, height / 2 + 100, 'OK', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#e8d5a3',
      fontStyle: 'bold',
    });
    okText.setOrigin(0.5);
    okText.setDepth(1001);
    
    okButton.on('pointerdown', () => {
      const newName = prompt('Enter your name (max 12 characters):', playerInput);
      if (newName && newName.trim()) {
        const sanitized = newName.trim().substring(0, 12);
        const active = ProfileManager.getActive();
        if (active) {
          ProfileManager.rename(active.slot, sanitized);
        } else {
          localStorage.setItem('playerName', sanitized);
        }
      }
      
      // Close dialog
      overlay.destroy();
      dialog.destroy();
      title.destroy();
      subtitle.destroy();
      inputBox.destroy();
      inputText.destroy();
      note.destroy();
      okButton.destroy();
      okText.destroy();
      cancelButton.destroy();
      cancelText.destroy();
      
      // Reload scene to show new name
      this.scene.restart();
    });
    
    // Cancel button
    const cancelButton = this.add.rectangle(width / 2 + 80, height / 2 + 100, 120, 50, 0x28190a);
    cancelButton.setStrokeStyle(2, 0xc9941a);
    cancelButton.setInteractive({ useHandCursor: true });
    cancelButton.setDepth(1001);
    
    const cancelText = this.add.text(width / 2 + 80, height / 2 + 100, 'CANCEL', {
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      color: '#e8d5a3',
      fontStyle: 'bold',
    });
    cancelText.setOrigin(0.5);
    cancelText.setDepth(1001);
    
    cancelButton.on('pointerdown', () => {
      overlay.destroy();
      dialog.destroy();
      title.destroy();
      subtitle.destroy();
      inputBox.destroy();
      inputText.destroy();
      note.destroy();
      okButton.destroy();
      okText.destroy();
      cancelButton.destroy();
      cancelText.destroy();
    });
  }
  
  createStyledButton(x, y, width, text, callback, isSecondary = false) {
    const height = isSecondary ? 34 : 36;
    const bgOpacity = isSecondary ? 0.65 : 0.85;
    const bgOpacityHover = isSecondary ? 0.75 : 0.85;
    
    // Create button background with graphics for gradient
    const buttonGraphics = this.add.graphics();
    buttonGraphics.fillGradientStyle(0x28190a, 0x28190a, 0x140a05, 0x140a05, bgOpacity, bgOpacity, bgOpacity + 0.05, bgOpacity + 0.05);
    buttonGraphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
    buttonGraphics.lineStyle(1, 0xc9941a, 1);
    buttonGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 4);
    
    // Make the graphics interactive
    buttonGraphics.setInteractive(
      new Phaser.Geom.Rectangle(x - width / 2, y - height / 2, width, height),
      Phaser.Geom.Rectangle.Contains
    );
    buttonGraphics.input.cursor = 'pointer';
    
    // Responsive font size: clamp(11px, 1.5vw, 14px)
    const screenWidth = this.scale.width;
    const responsiveFontSize = Math.max(11, Math.min(screenWidth * 0.015, 14));
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: `${responsiveFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#e8d5a3',
      fontStyle: 'bold',
      letterSpacing: 2,
    });
    buttonText.setOrigin(0.5);
    
    // Hover effects
    buttonGraphics.on('pointerover', () => {
      buttonGraphics.clear();
      buttonGraphics.fillGradientStyle(0x352010, 0x352010, 0x1a0f07, 0x1a0f07, bgOpacityHover, bgOpacityHover, bgOpacityHover + 0.05, bgOpacityHover + 0.05);
      buttonGraphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
      buttonGraphics.lineStyle(1, 0xf0c040, 1);
      buttonGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 4);
      
      // Add glow shadow
      buttonGraphics.lineStyle(10, 0xc9941a, 0.4);
      buttonGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 4);
      buttonGraphics.lineStyle(1, 0xf0c040, 1);
      buttonGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 4);
    });
    
    buttonGraphics.on('pointerout', () => {
      buttonGraphics.clear();
      buttonGraphics.fillGradientStyle(0x28190a, 0x28190a, 0x140a05, 0x140a05, bgOpacity, bgOpacity, bgOpacity + 0.05, bgOpacity + 0.05);
      buttonGraphics.fillRoundedRect(x - width / 2, y - height / 2, width, height, 4);
      buttonGraphics.lineStyle(1, 0xc9941a, 1);
      buttonGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, 4);
    });
    
    buttonGraphics.on('pointerdown', () => {
      this.tweens.add({
        targets: [buttonGraphics, buttonText],
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      callback();
    });
    
    return { button: buttonGraphics, buttonText };
  }
  
  showHowToPlay() {
    const { width, height } = this.scale;
    
    // Store tutorial elements for cleanup
    const tutorialElements = [];
    
    // Dark overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.85);
    overlay.setOrigin(0);
    overlay.setDepth(100);
    overlay.setInteractive();
    tutorialElements.push(overlay);
    
    // Main panel - larger for more content
    const panelWidth = Math.min(1000, width * 0.9);
    const panelHeight = Math.min(700, height * 0.9);
    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x2C2416);
    panel.setStrokeStyle(5, 0xFFD700);
    panel.setDepth(101);
    tutorialElements.push(panel);
    
    // Title
    const title = this.add.text(width / 2, height / 2 - panelHeight / 2 + 40, 'HOW TO PLAY', {
      fontSize: '32px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    });
    title.setOrigin(0.5);
    title.setDepth(102);
    tutorialElements.push(title);
    
    // Content area
    const contentY = height / 2 - panelHeight / 2 + 90;
    const leftX = width / 2 - panelWidth / 2 + 40;
    const rightX = width / 2 + 80;
    const sectionSpacing = 140;
    
    // OBJECTIVE Section
    let currentY = contentY;
    tutorialElements.push(
      this.add.text(leftX, currentY, '🎯 OBJECTIVE', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(leftX, currentY, 'Destroy the enemy base before\nthey destroy yours!', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // RESOURCES Section
    currentY += 55;
    tutorialElements.push(
      this.add.text(leftX, currentY, '💰 RESOURCES', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(leftX, currentY, 'Gold: Train units & build\nMana: Cast powerful spells\nWorkers harvest gold mines', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // UNITS Section
    currentY += 70;
    tutorialElements.push(
      this.add.text(leftX, currentY, '⚔️ UNITS', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(leftX, currentY, 
        'Worker: Harvests gold (50g)\n' +
        'Scout: Fast, enhanced vision (60g)\n' +
        'Legionary: Basic melee (75g)\n' +
        'Pilum Thrower: Ranged (100g)\n' +
        'Centurion: Elite tank (200g)', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // SPELLS Section
    currentY += 95;
    tutorialElements.push(
      this.add.text(leftX, currentY, '✨ SPELLS', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(leftX, currentY, 
        'Lightning: AOE damage (50 mana)\n' +
        'Heal: Restore HP (40 mana)\n' +
        'Boost: Speed buff (30 mana)', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // Right side - CONTROLS & STRATEGY
    currentY = contentY;
    
    // CONTROLS Section
    tutorialElements.push(
      this.add.text(rightX, currentY, '🎮 CONTROLS', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(rightX, currentY, 
        'A/D Keys: Scroll camera left/right\n' +
        'Mouse Edges: Also scroll camera\n' +
        'Click Unit Buttons: Train units\n' +
        'Click Spell: Select, then click\n' +
        '  battlefield to cast\n' +
        'Minimap: Click to jump camera\n' +
        'Hover Buttons: View tooltips\n' +
        'Speed Button: 1x/2x/3x speed\n' +
        'Pause Button: Pause game', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // UPGRADES Section
    currentY += 160;
    tutorialElements.push(
      this.add.text(rightX, currentY, '🔧 UPGRADES', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(rightX, currentY, 
        'Aqueduct: +2 mana/sec (200g)\n' +
        'Forging: +5 unit damage (150g)\n' +
        'Armor: +20 unit HP (150g)\n' +
        'March: +10% unit speed (100g)', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // STRATEGY TIPS Section
    currentY += 95;
    tutorialElements.push(
      this.add.text(rightX, currentY, '💡 STRATEGY TIPS', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      }).setOrigin(0).setDepth(102)
    );
    currentY += 30;
    tutorialElements.push(
      this.add.text(rightX, currentY, 
        '• Train 2-3 workers early\n' +
        '• Build balanced armies\n' +
        '• Use spells in battles\n' +
        '• Upgrade to gain advantage\n' +
        '• Watch enemy movements', {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#FFFFFF',
        lineSpacing: 5,
      }).setOrigin(0).setDepth(102)
    );
    
    // Close button at bottom
    const closeButton = this.add.rectangle(width / 2, height / 2 + panelHeight / 2 - 40, 200, 50, 0x8B4513);
    closeButton.setStrokeStyle(3, 0xFFD700);
    closeButton.setDepth(102);
    closeButton.setInteractive({ useHandCursor: true });
    tutorialElements.push(closeButton);
    
    const closeText = this.add.text(width / 2, height / 2 + panelHeight / 2 - 40, 'CLOSE', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    closeText.setOrigin(0.5);
    closeText.setDepth(103);
    tutorialElements.push(closeText);
    
    // Button hover effects
    closeButton.on('pointerover', () => {
      closeButton.setFillStyle(0xA0522D);
    });
    
    closeButton.on('pointerout', () => {
      closeButton.setFillStyle(0x8B4513);
    });
    
    // Close tutorial on button click or overlay click
    const closeTutorial = () => {
      tutorialElements.forEach(el => el.destroy());
    };
    
    closeButton.once('pointerdown', closeTutorial);
    overlay.once('pointerdown', closeTutorial);
  }
  
  startTransition(nextScene) {
    if (this._transitioning) return;
    this._transitioning = true;

    MusicManager.stop();

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(nextScene);
    });
  }

  shutdown() {}
}
