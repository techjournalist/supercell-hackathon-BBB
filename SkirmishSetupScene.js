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

    // Responsive sizing
    const titleSize = Math.max(20, Math.min(48, width * 0.045));
    const sectionSize = Math.max(12, Math.min(24, width * 0.025));
    const factionBtnW = Math.min(250, (width - 80) / 3 - 20);
    const factionBtnH = Math.min(120, height * 0.18);
    const factionSpacing = factionBtnW + Math.min(30, width * 0.025);
    const diffBtnW = Math.min(220, (width - 80) / 3 - 20);
    const diffBtnH = Math.min(100, height * 0.15);
    const diffSpacing = diffBtnW + Math.min(30, width * 0.025);
    const iconSize = Math.max(24, Math.min(48, width * 0.04));
    const labelSize = Math.max(10, Math.min(18, width * 0.018));
    const skullSize = Math.max(14, Math.min(24, width * 0.022));
    const diffLabelSize = Math.max(9, Math.min(16, width * 0.016));

    // Title
    const titleY = Math.min(80, height * 0.12);
    const title = this.add.text(width / 2, titleY, 'SKIRMISH SETUP', {
      fontSize: `${titleSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: Math.max(3, titleSize * 0.12),
    });
    title.setOrigin(0.5);

    // Selected options
    this.selectedFaction = 'roman';
    this.selectedDifficulty = 'medium';

    // FACTION SELECTION SECTION
    const factionY = titleY + titleSize + Math.min(40, height * 0.06);
    const factionLabel = this.add.text(width / 2, factionY, 'SELECT FACTION', {
      fontSize: `${sectionSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    factionLabel.setOrigin(0.5);

    const factionBtnY = factionY + sectionSize + Math.min(40, height * 0.06);
    this.createFactionButton(width / 2 - factionSpacing, factionBtnY, 'ROMANS', 'roman', '🛡️', factionBtnW, factionBtnH, iconSize, labelSize);
    this.createFactionButton(width / 2, factionBtnY, 'VIKINGS', 'viking', '⚔️', factionBtnW, factionBtnH, iconSize, labelSize);
    this.createFactionButton(width / 2 + factionSpacing, factionBtnY, 'ALIENS', 'alien', '👽', factionBtnW, factionBtnH, iconSize, labelSize);

    // DIFFICULTY SELECTION SECTION
    const difficultyY = factionBtnY + factionBtnH / 2 + Math.min(50, height * 0.07);
    const difficultyLabel = this.add.text(width / 2, difficultyY, 'AI DIFFICULTY', {
      fontSize: `${sectionSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    difficultyLabel.setOrigin(0.5);

    const diffBtnY = difficultyY + sectionSize + Math.min(40, height * 0.06);
    this.createDifficultyButton(width / 2 - diffSpacing, diffBtnY, 'EASY', 'easy', 1, diffBtnW, diffBtnH, skullSize, diffLabelSize);
    this.createDifficultyButton(width / 2, diffBtnY, 'MEDIUM', 'medium', 2, diffBtnW, diffBtnH, skullSize, diffLabelSize);
    this.createDifficultyButton(width / 2 + diffSpacing, diffBtnY, 'HARD', 'hard', 3, diffBtnW, diffBtnH, skullSize, diffLabelSize);

    // START BATTLE BUTTON
    const startBtnW = Math.min(300, width * 0.4);
    const startBtnH = Math.min(70, height * 0.1);
    const btnFontSize = Math.max(12, Math.min(20, width * 0.02));
    this.createButton(width / 2, height - Math.min(120, height * 0.18), startBtnW, startBtnH, 'START BATTLE', () => {
      this.startBattle();
    }, btnFontSize);

    // Back button
    const backBtnW = Math.min(200, width * 0.28);
    const backBtnH = Math.min(50, height * 0.07);
    this.createButton(width / 2, height - Math.min(40, height * 0.06), backBtnW, backBtnH, 'BACK', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    }, Math.max(10, btnFontSize - 2));

    // Resize handler
    this.scale.on('resize', () => this.scene.restart());
  }
  
  createFactionButton(x, y, label, faction, icon, btnW = 250, btnH = 120, iconSz = 48, labelSz = 18) {
    const button = this.add.rectangle(x, y, btnW, btnH, 0x8B4513);
    button.setStrokeStyle(Math.max(2, btnW * 0.016), 0xFFD700);
    button.setInteractive({ useHandCursor: true });

    const iconText = this.add.text(x, y - btnH * 0.2, icon, {
      fontSize: `${iconSz}px`,
    });
    iconText.setOrigin(0.5);

    const labelText = this.add.text(x, y + btnH * 0.25, label, {
      fontSize: `${labelSz}px`,
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
  
  createDifficultyButton(x, y, label, difficulty, skullCount, btnW = 220, btnH = 100, skullSz = 24, labelSz = 16) {
    const button = this.add.rectangle(x, y, btnW, btnH, 0x8B4513);
    button.setStrokeStyle(Math.max(2, btnW * 0.018), 0xFFD700);
    button.setInteractive({ useHandCursor: true });

    const skullText = '☠️'.repeat(skullCount);
    const skulls = this.add.text(x, y - btnH * 0.22, skullText, {
      fontSize: `${skullSz}px`,
    });
    skulls.setOrigin(0.5);

    const labelText = this.add.text(x, y + btnH * 0.2, label, {
      fontSize: `${labelSz}px`,
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
  
  createButton(x, y, width, height, text, callback, fontSize = 20) {
    const button = this.add.rectangle(x, y, width, height, 0x8B4513);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(Math.max(2, width * 0.013), 0xFFD700);

    const buttonText = this.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
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
