import Phaser from 'phaser';

export class SkirmishSetupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'SkirmishSetupScene' });
  }
  
  preload() {
    // Load generic background
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Background image
    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);
    
    // Add semi-transparent overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);
    
    // Title
    const title = this.add.text(width / 2, 80, 'SKIRMISH SETUP', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Selected options
    this.selectedFaction = 'roman';
    this.selectedDifficulty = 'medium';
    
    // FACTION SELECTION SECTION
    const factionY = 200;
    const factionLabel = this.add.text(width / 2, factionY, 'SELECT FACTION', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    factionLabel.setOrigin(0.5);
    
    // Roman faction button
    this.createFactionButton(width / 2 - 280, factionY + 80, 'ROMANS', 'roman', '🛡️');
    
    // Viking faction button
    this.createFactionButton(width / 2, factionY + 80, 'VIKINGS', 'viking', '⚔️');
    
    // Alien faction button
    this.createFactionButton(width / 2 + 280, factionY + 80, 'ALIENS', 'alien', '👽');
    
    // DIFFICULTY SELECTION SECTION
    const difficultyY = 420;
    const difficultyLabel = this.add.text(width / 2, difficultyY, 'AI DIFFICULTY', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    difficultyLabel.setOrigin(0.5);
    
    // Difficulty buttons
    this.createDifficultyButton(width / 2 - 300, difficultyY + 80, 'EASY', 'easy', 1);
    this.createDifficultyButton(width / 2, difficultyY + 80, 'MEDIUM', 'medium', 2);
    this.createDifficultyButton(width / 2 + 300, difficultyY + 80, 'HARD', 'hard', 3);
    
    // START BATTLE BUTTON
    this.createButton(width / 2, height - 120, 300, 70, 'START BATTLE', () => {
      this.startBattle();
    });
    
    // Back button
    this.createButton(width / 2, height - 40, 200, 50, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }
  
  createFactionButton(x, y, label, faction, icon) {
    const button = this.add.rectangle(x, y, 250, 120, 0x8B4513);
    button.setStrokeStyle(4, 0xFFD700);
    button.setInteractive({ useHandCursor: true });
    
    // Icon
    const iconText = this.add.text(x, y - 30, icon, {
      fontSize: '48px',
    });
    iconText.setOrigin(0.5);
    
    // Label
    const labelText = this.add.text(x, y + 30, label, {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    labelText.setOrigin(0.5);
    
    // Store references
    if (!this.factionButtons) this.factionButtons = {};
    this.factionButtons[faction] = { button, iconText, labelText };
    
    // Highlight if selected
    if (faction === this.selectedFaction) {
      button.setFillStyle(0xA0522D);
      button.setStrokeStyle(5, 0xFFFFFF);
    }
    
    button.on('pointerover', () => {
      if (faction !== this.selectedFaction) {
        button.setFillStyle(0xA0522D);
      }
    });
    
    button.on('pointerout', () => {
      if (faction !== this.selectedFaction) {
        button.setFillStyle(0x8B4513);
      }
    });
    
    button.on('pointerdown', () => {
      this.selectFaction(faction);
    });
  }
  
  createDifficultyButton(x, y, label, difficulty, skullCount) {
    const button = this.add.rectangle(x, y, 220, 100, 0x8B4513);
    button.setStrokeStyle(4, 0xFFD700);
    button.setInteractive({ useHandCursor: true });
    
    // Skull icons
    const skullText = '☠️'.repeat(skullCount);
    const skulls = this.add.text(x, y - 25, skullText, {
      fontSize: '24px',
    });
    skulls.setOrigin(0.5);
    
    // Label
    const labelText = this.add.text(x, y + 20, label, {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    labelText.setOrigin(0.5);
    
    // Store references
    if (!this.difficultyButtons) this.difficultyButtons = {};
    this.difficultyButtons[difficulty] = { button, skulls, labelText };
    
    // Highlight if selected
    if (difficulty === this.selectedDifficulty) {
      button.setFillStyle(0xA0522D);
      button.setStrokeStyle(5, 0xFFFFFF);
    }
    
    button.on('pointerover', () => {
      if (difficulty !== this.selectedDifficulty) {
        button.setFillStyle(0xA0522D);
      }
    });
    
    button.on('pointerout', () => {
      if (difficulty !== this.selectedDifficulty) {
        button.setFillStyle(0x8B4513);
      }
    });
    
    button.on('pointerdown', () => {
      this.selectDifficulty(difficulty);
    });
  }
  
  selectFaction(faction) {
    // Unhighlight previous
    Object.keys(this.factionButtons).forEach(key => {
      const btn = this.factionButtons[key].button;
      btn.setFillStyle(0x8B4513);
      btn.setStrokeStyle(4, 0xFFD700);
    });
    
    // Highlight selected
    const selected = this.factionButtons[faction].button;
    selected.setFillStyle(0xA0522D);
    selected.setStrokeStyle(5, 0xFFFFFF);
    
    this.selectedFaction = faction;
  }
  
  selectDifficulty(difficulty) {
    // Unhighlight previous
    Object.keys(this.difficultyButtons).forEach(key => {
      const btn = this.difficultyButtons[key].button;
      btn.setFillStyle(0x8B4513);
      btn.setStrokeStyle(4, 0xFFD700);
    });
    
    // Highlight selected
    const selected = this.difficultyButtons[difficulty].button;
    selected.setFillStyle(0xA0522D);
    selected.setStrokeStyle(5, 0xFFFFFF);
    
    this.selectedDifficulty = difficulty;
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
  
  startBattle() {
    // Store selections in registry
    this.registry.set('selectedFaction', this.selectedFaction);
    this.registry.set('skirmishDifficulty', this.selectedDifficulty);
    this.registry.set('campaignLevel', null); // Not campaign mode
    
    // Transition to game
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameScene');
    });
  }
}
