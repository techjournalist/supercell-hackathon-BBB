import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { MusicManager } from './MusicManager.js';
import { getAllLevelStars } from './supabase.js';

export class AlienCampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AlienCampaignScene' });
  }

  preload() {
    this.load.image('zyx9-portrait', 'https://rosebud.ai/assets/zyx9-portrait.webp?8tVr');
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
  }

  create() {
    this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
    this.buildUI();

    getAllLevelStars().then(map => {
      this.starMap = map;
      this.buildUI();
    });

    if (AudioManager.shouldPlayMusic()) {
      MusicManager.play('alien-music');
    }

    this.input.once('pointerdown', () => {
      MusicManager.tryUnlock();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('alien-music');
      }
    });

    this.events.on('wake', () => {
      this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
      this.buildUI();
      if (AudioManager.shouldPlayMusic()) MusicManager.play('alien-music');
    });

    this.events.on('resume', () => {
      this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
      this.buildUI();
      if (AudioManager.shouldPlayMusic()) MusicManager.play('alien-music');
    });
  }

  buildUI() {
    this.children.removeAll();

    const { width, height } = this.scale;

    const alienProgress = parseInt(localStorage.getItem('alienCampaignProgress') || '0');
    const globalDifficulty = localStorage.getItem('campaignDifficulty') || 'normal';

    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);

    const title = this.add.text(width / 2, 44, 'ALIEN CAMPAIGN', {
      fontSize: '36px',
      fontFamily: 'Press Start 2P',
      color: '#39FF14',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(width / 2, 90, 'Overlord Zyx-9', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    subtitle.setOrigin(0.5);

    const progressText = this.add.text(width / 2, 116, `PROGRESS: ${alienProgress}/6 INVASIONS COMPLETE`, {
      fontSize: '11px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    progressText.setOrigin(0.5);

    this.createGlobalDifficultyBar(width / 2, 144, globalDifficulty);

    const levels = [
      { num: 1, name: 'Abduction 101', desc: 'Tutorial' },
      { num: 2, name: 'Colony Strike', desc: 'Destroy Roman fort' },
      { num: 3, name: 'Harvest Season', desc: 'Collect 1500 gold' },
      { num: 4, name: 'Mind Games', desc: 'Use Mind Control 5x' },
      { num: 5, name: 'Invasion Force', desc: 'Destroy Viking base' },
      { num: 6, name: 'World Domination', desc: 'Final assault' },
    ];

    const startY = 184;
    const spacing = 70;

    levels.forEach((level, index) => {
      const y = startY + index * spacing;
      const isUnlocked = index <= alienProgress;
      const isCompleted = index < alienProgress;
      this.createLevelRow(width, y, level, isUnlocked, isCompleted);
    });

    this.createBackButton(width / 2 - 230, height - 50);
    this.createProfileButton(width / 2 + 210, height - 50);
  }

  createGlobalDifficultyBar(cx, cy, currentDiff) {
    const difficulties = ['easy', 'normal', 'hard'];
    const colors = { easy: 0x4CAF50, normal: 0x39FF14, hard: 0xE53935 };
    const labels = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' };
    const btnW = 100;
    const gap = 8;
    const totalW = difficulties.length * btnW + (difficulties.length - 1) * gap;
    const startX = cx - totalW / 2;

    const labelText = this.add.text(cx - totalW / 2 - 10, cy, 'DIFFICULTY:', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    labelText.setOrigin(1, 0.5);

    difficulties.forEach((diff, i) => {
      const bx = startX + i * (btnW + gap) + btnW / 2;
      const isSelected = diff === currentDiff;
      const col = colors[diff];

      const btn = this.add.rectangle(bx, cy, btnW, 22, col, isSelected ? 0.9 : 0.3);
      btn.setStrokeStyle(2, col);
      btn.setInteractive({ useHandCursor: true });

      const txt = this.add.text(bx, cy, labels[diff], {
        fontSize: '9px',
        fontFamily: 'Press Start 2P',
        color: isSelected ? '#FFFFFF' : '#888888',
      });
      txt.setOrigin(0.5);

      btn.on('pointerover', () => {
        if (diff !== currentDiff) btn.setFillStyle(col, 0.5);
      });
      btn.on('pointerout', () => {
        if (diff !== currentDiff) btn.setFillStyle(col, 0.3);
      });
      btn.on('pointerdown', () => {
        localStorage.setItem('campaignDifficulty', diff);
        this.buildUI();
      });
    });
  }

  getBestStarsForLevel(levelNum) {
    let best = 0;
    ['easy', 'normal', 'hard'].forEach(diff => {
      const key = `alien_${levelNum}_${diff}`;
      if (this.starMap && this.starMap[key]) {
        best = Math.max(best, this.starMap[key]);
      }
    });
    return best;
  }

  createLevelRow(width, y, level, isUnlocked, isCompleted) {
    const container = this.add.container(width / 2 - 100, y);

    const button = this.add.rectangle(250, 0, 500, 60, isUnlocked ? 0x1B5E20 : 0x333333);
    button.setOrigin(0, 0.5);
    button.setStrokeStyle(2, isUnlocked ? 0x39FF14 : 0x666666);

    if (isUnlocked) {
      button.setInteractive({ useHandCursor: true });

      button.on('pointerover', () => button.setFillStyle(0x2E7D32));
      button.on('pointerout', () => button.setFillStyle(0x1B5E20));
      button.on('pointerdown', () => {
        const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
        const perLevelMap = JSON.parse(localStorage.getItem('levelDifficulty_alien') || '{}');
        const chosenDiff = perLevelMap[level.num] || globalDiff;
        this.startLevel(level.num, chosenDiff);
      });
    }
    container.add(button);

    const numText = this.add.text(270, 0, `L${level.num}`, {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: isUnlocked ? '#39FF14' : '#666666',
    });
    numText.setOrigin(0, 0.5);
    container.add(numText);

    const nameText = this.add.text(330, -10, level.name, {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: isUnlocked ? '#CCFFCC' : '#666666',
    });
    nameText.setOrigin(0, 0.5);
    container.add(nameText);

    const descText = this.add.text(330, 10, level.desc, {
      fontSize: '11px',
      fontFamily: 'Press Start 2P',
      color: isUnlocked ? '#39FF14' : '#555555',
    });
    descText.setOrigin(0, 0.5);
    container.add(descText);

    if (isCompleted) {
      const bestStars = this.getBestStarsForLevel(level.num);
      for (let s = 1; s <= 3; s++) {
        const sx = 690 + (s - 2) * 18;
        const star = this.add.text(sx, -8, '★', {
          fontSize: '18px',
          color: s <= bestStars ? '#FFD700' : '#444444',
          stroke: '#000000',
          strokeThickness: 2,
        });
        star.setOrigin(0.5);
        container.add(star);
      }
    }

    if (!isUnlocked) {
      const check = this.add.text(720, 0, '🔒', { fontSize: '22px' });
      check.setOrigin(0.5);
      container.add(check);
    }

    if (isUnlocked) {
      const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
      const perLevelMap = JSON.parse(localStorage.getItem('levelDifficulty_alien') || '{}');
      const selectedDiff = perLevelMap[level.num] || globalDiff;

      const diffColors = { easy: '#4CAF50', normal: '#39FF14', hard: '#E53935' };
      const diffBadge = this.add.text(690, 12, selectedDiff.toUpperCase(), {
        fontSize: '8px',
        fontFamily: 'Press Start 2P',
        color: diffColors[selectedDiff],
      });
      diffBadge.setOrigin(0.5);
      container.add(diffBadge);
    }
  }

  stopAlienMusic() {
    MusicManager.stop();
  }

  createBackButton(x, y) {
    const backButton = this.add.rectangle(x, y, 190, 44, 0x1B5E20);
    backButton.setStrokeStyle(2, 0x39FF14);
    backButton.setInteractive({ useHandCursor: true });

    const backText = this.add.text(x, y, 'BACK', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    backText.setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0x2E7D32));
    backButton.on('pointerout', () => backButton.setFillStyle(0x1B5E20));
    backButton.on('pointerdown', () => {
      this.stopAlienMusic();
      this.scene.start('MenuScene');
    });
  }

  createProfileButton(x, y) {
    const button = this.add.rectangle(x, y, 190, 44, 0x1565C0);
    button.setStrokeStyle(3, 0x42A5F5);
    button.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, 'PROFILE', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0x1976D2));
    button.on('pointerout', () => button.setFillStyle(0x1565C0));
    button.on('pointerdown', () => this.showProfileOverlay());
  }

  showProfileOverlay() {
    const { width, height } = this.scale;
    const overlay = this.add.container(width / 2, height / 2);
    overlay.setDepth(2000);

    const bg = this.add.rectangle(0, 0, width * 0.92, height * 0.88, 0x000000, 0.95);
    bg.setStrokeStyle(3, 0x39FF14);
    overlay.add(bg);

    const title = this.add.text(0, -(height * 0.44) + 30, 'CAMPAIGN STARS PROFILE', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#39FF14',
    });
    title.setOrigin(0.5);
    overlay.add(title);

    const campaigns = [
      { type: 'roman', label: 'ROMAN', color: '#FFD700', levels: 8 },
      { type: 'viking', label: 'VIKING', color: '#87CEEB', levels: 6 },
      { type: 'alien', label: 'ALIEN', color: '#39FF14', levels: 6 },
    ];

    const colW = (width * 0.88) / 3;
    const startY = -(height * 0.44) + 70;

    campaigns.forEach((camp, ci) => {
      const cx = -colW + ci * colW;

      const colHeader = this.add.text(cx, startY, camp.label, {
        fontSize: '14px',
        fontFamily: 'Press Start 2P',
        color: camp.color,
      });
      colHeader.setOrigin(0.5);
      overlay.add(colHeader);

      for (let ln = 1; ln <= camp.levels; ln++) {
        const rowY = startY + 32 + (ln - 1) * 52;

        const rowBg = this.add.rectangle(cx, rowY, colW - 16, 44, 0x111111, 0.8);
        rowBg.setStrokeStyle(1, 0x333333);
        overlay.add(rowBg);

        const levelLabel = this.add.text(cx, rowY - 10, `LVL ${ln}`, {
          fontSize: '9px',
          fontFamily: 'Press Start 2P',
          color: '#FFFFFF',
        });
        levelLabel.setOrigin(0.5);
        overlay.add(levelLabel);

        const starRow = this.add.container(cx, rowY + 10);
        const diffEntries = ['easy', 'normal', 'hard'];
        const diffCols = { easy: '#4CAF50', normal: '#FFD700', hard: '#E53935' };
        const diffSpacingX = 50;

        diffEntries.forEach((diff, di) => {
          const sx = -diffSpacingX + di * diffSpacingX;
          const starKey = `${camp.type}_${ln}_${diff}`;
          const stars = (this.starMap && this.starMap[starKey]) || 0;

          const diffLabel = this.add.text(sx, -8, diff[0].toUpperCase(), {
            fontSize: '7px',
            fontFamily: 'Press Start 2P',
            color: diffCols[diff],
          });
          diffLabel.setOrigin(0.5);
          starRow.add(diffLabel);

          const starText = stars > 0 ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : '---';
          const starDisplay = this.add.text(sx, 4, starText, {
            fontSize: '10px',
            color: stars > 0 ? diffCols[diff] : '#444444',
          });
          starDisplay.setOrigin(0.5);
          starRow.add(starDisplay);
        });

        overlay.add(starRow);
      }
    });

    const closeBtn = this.add.rectangle(0, height * 0.44 - 30, 160, 36, 0x1B5E20);
    closeBtn.setStrokeStyle(2, 0x39FF14);
    closeBtn.setInteractive({ useHandCursor: true });
    overlay.add(closeBtn);

    const closeTxt = this.add.text(0, height * 0.44 - 30, 'CLOSE', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    closeTxt.setOrigin(0.5);
    overlay.add(closeTxt);

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x2E7D32));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x1B5E20));
    closeBtn.on('pointerdown', () => overlay.destroy());
  }

  startLevel(levelNum) {
    this.stopAlienMusic();

    const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
    const perLevelMap = JSON.parse(localStorage.getItem('levelDifficulty_alien') || '{}');
    const chosenDiff = perLevelMap[levelNum] || globalDiff;

    this.registry.set('alienCampaign', true);
    this.registry.set('vikingCampaign', false);
    this.registry.set('alienLevel', levelNum);
    this.registry.set('campaignLevel', levelNum);
    this.registry.set('campaignDifficulty', chosenDiff);

    this.scene.start('AlienComicIntroScene');
  }

  shutdown() {}
}
