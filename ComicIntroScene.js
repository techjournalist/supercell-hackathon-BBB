import Phaser from 'phaser';

export class ComicIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ComicIntroScene' });
  }
  
  init(data) {
    this.levelNum = data.levelNum;
    
    // Track campaign start time for level 1
    if (this.levelNum === 1) {
      const startKey = 'roman_campaign_start';
      if (!localStorage.getItem(startKey)) {
        localStorage.setItem(startKey, Date.now().toString());

      }
    }
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Background
    const bg = this.add.rectangle(0, 0, width, height, 0x000000);
    bg.setOrigin(0);
    
    // Comic panel background
    const panelWidth = Math.min(900, width * 0.9);
    const panelHeight = Math.min(500, height * 0.8);
    const panel = this.add.rectangle(width / 2, height / 2, panelWidth, panelHeight, 0x2C2416);
    panel.setStrokeStyle(6, 0xFFD700);
    
    // Emperor portrait (left side) - responsive
    const portraitSize = Math.min(120, panelWidth * 0.15, panelHeight * 0.25);
    const portraitX = width / 2 - panelWidth / 2 + Math.min(100, panelWidth * 0.12);
    const portraitY = height / 2 - panelHeight / 2 + Math.min(100, panelHeight * 0.2);

    // Portrait frame
    const portraitFrame = this.add.rectangle(portraitX, portraitY, portraitSize, portraitSize, 0x8B4513);
    portraitFrame.setStrokeStyle(Math.max(2, portraitSize * 0.03), 0xFFD700);

    // Emperor emoji portrait
    const emojiFS = Math.max(36, Math.min(portraitSize * 0.65, 80));
    const emperor = this.add.text(portraitX, portraitY, '👑', {
      fontSize: `${emojiFS}px`,
    });
    emperor.setOrigin(0.5);

    // Emperor name
    const nameFS = Math.max(8, Math.min(panelWidth * 0.016, 14));
    const nameText = this.add.text(portraitX, portraitY + portraitSize * 0.65, 'Emperor\nGluteus\nMaximus', {
      fontSize: `${nameFS}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      align: 'center',
      lineSpacing: 2,
    });
    nameText.setOrigin(0.5);
    
    // Dialogue data for each level
    const dialogues = {
      1: {
        title: 'LEVEL 1: BASIC TRAINING',
        lines: [
          'Greetings, young legionnaire!',
          '',
          'Before you face the alien menace,',
          'you must learn the ways of war.',
          '',
          'Train 3 miners to gather gold.',
          'Then train 5 legionaries for battle.',
          '',
          'Follow the arrow prompts!',
        ]
      },
      2: {
        title: 'LEVEL 2: FIRST CONTACT',
        lines: [
          'Reports confirm it - ALIENS!',
          '',
          'These extraterrestrial scoundrels',
          'have landed on Roman soil!',
          '',
          'Destroy their base before they',
          'establish a foothold.',
          '',
          'Show them Roman might!',
        ]
      },
      3: {
        title: 'LEVEL 3: HOLD THE LINE',
        lines: [
          'The aliens are attacking in waves!',
          '',
          'Your base must survive for 3 minutes',
          'against continuous assaults.',
          '',
          'Build defenses quickly!',
          'Train units constantly!',
          '',
          'Do NOT let the base fall!',
        ]
      },
      4: {
        title: 'LEVEL 4: THE GAUNTLET',
        lines: [
          'A special mission, legionnaire.',
          '',
          'You have 10 elite legionaries.',
          'No gold. No reinforcements.',
          '',
          'Fight your way through alien forces',
          'and destroy their base.',
          '',
          'Victory or Valhalla!',
        ]
      },
      5: {
        title: 'LEVEL 5: MANA MASTERY',
        lines: [
          'The priests have unlocked ancient magic!',
          '',
          'Build an Aqueduct for mana.',
          'Cast Lightning, Heal, and Boost',
          'to master these powers.',
          '',
          'Magic + Might = VICTORY!',
          '',
          'Use all 3 spells to complete training!',
        ]
      },
      6: {
        title: 'LEVEL 6: BEHIND ENEMY LINES',
        lines: [
          'A stealth assault is required.',
          '',
          'You have 600 gold - spend it wisely.',
          'NO miners allowed - stay hidden!',
          '',
          'The alien base is heavily fortified.',
          '',
          'Strike hard. Strike fast.',
          'Leave no survivors!',
        ]
      },
      7: {
        title: 'LEVEL 7: ALIEN ONSLAUGHT',
        lines: [
          'This is it - full-scale war!',
          '',
          'The aliens are using all their units,',
          'spells, and technology against us.',
          '',
          'Their base has 1500 HP.',
          '',
          'Use everything you\'ve learned.',
          'FOR ROME!',
        ]
      },
      8: {
        title: 'LEVEL 8: THE MOTHERSHIP',
        lines: [
          'The alien Mothership has arrived!',
          '',
          '2500 HP of pure alien fury.',
          'Elite troops. Devastating spells.',
          'Advanced technology.',
          '',
          'This is the final battle.',
          '',
          'Save Rome... or perish trying!',
        ]
      }
    };
    
    const dialogue = dialogues[this.levelNum];
    
    // Title
    const comicTitleFS = Math.max(14, Math.min(panelWidth * 0.03, 28));
    const titleText = this.add.text(width / 2, height / 2 - panelHeight / 2 + 40, dialogue.title, {
      fontSize: `${comicTitleFS}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: Math.max(2, comicTitleFS * 0.14),
    });
    titleText.setOrigin(0.5);

    // Dialogue box
    const dialogueFS = Math.max(10, Math.min(panelWidth * 0.018, 16));
    const dialogueX = width / 2 + panelWidth * 0.06;
    const dialogueY = height / 2 - panelHeight * 0.08;

    const dialogueText = this.add.text(dialogueX, dialogueY, dialogue.lines.join('\n'), {
      fontSize: `${dialogueFS}px`,
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'left',
      lineSpacing: Math.max(4, panelHeight * 0.015),
      wordWrap: { width: panelWidth - Math.min(300, panelWidth * 0.35) }
    });
    dialogueText.setOrigin(0.5);

    const btnFS = Math.max(10, Math.min(panelWidth * 0.018, 18));
    const btnW = Math.min(200, panelWidth * 0.28);
    const btnContW = Math.min(250, panelWidth * 0.32);
    const btnH = Math.min(50, panelHeight * 0.1);
    const buttonY = height / 2 + panelHeight / 2 - btnH;

    // Back button
    const backButton = this.add.rectangle(width / 2 - panelWidth * 0.2, buttonY, btnW, btnH, 0x2C2416);
    backButton.setStrokeStyle(3, 0xAAAAAA);
    backButton.setInteractive({ useHandCursor: true });

    const backText = this.add.text(width / 2 - panelWidth * 0.2, buttonY, '< BACK', {
      fontSize: `${btnFS}px`,
      fontFamily: 'Press Start 2P',
      color: '#CCCCCC',
    });
    backText.setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0x3C3426));
    backButton.on('pointerout', () => backButton.setFillStyle(0x2C2416));
    backButton.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CampaignScene');
      });
    });

    // Continue button
    const continueButton = this.add.rectangle(width / 2 + panelWidth * 0.1, buttonY, btnContW, btnH, 0x8B4513);
    continueButton.setStrokeStyle(4, 0xFFD700);
    continueButton.setInteractive({ useHandCursor: true });

    const continueText = this.add.text(width / 2 + panelWidth * 0.1, buttonY, 'BEGIN MISSION', {
      fontSize: `${btnFS}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    continueText.setOrigin(0.5);

    continueButton.on('pointerover', () => {
      continueButton.setFillStyle(0xA0522D);
    });

    continueButton.on('pointerout', () => {
      continueButton.setFillStyle(0x8B4513);
    });

    const goToMission = () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('FactionSelectScene', { campaignLevel: this.levelNum });
      });
    };

    continueButton.on('pointerdown', goToMission);

    this.input.keyboard.once('keydown-SPACE', goToMission);

    this.input.keyboard.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('CampaignScene');
      });
    });
  }
}
