import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { MusicManager } from './MusicManager.js';
import { getAllLevelStars } from './supabase.js';

export class VikingCampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VikingCampaignScene' });
  }

  preload() {
    this.load.image('erik', 'https://rosebud.ai/assets/erik-portrait.webp?e1Ak');
    this.load.image('generic-bg', 'https://rosebud.ai/assets/generic-background.jpeg?BvlM');
  }

  create() {
    this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
    this.buildUI();
    this.scale.on('resize', () => this.buildUI());

    getAllLevelStars().then(map => {
      this.starMap = map;
      this.buildUI();
    });

    if (AudioManager.shouldPlayMusic()) {
      MusicManager.play('viking-music');
    }

    this.input.once('pointerdown', () => {
      MusicManager.tryUnlock();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('viking-music');
      }
    });

    this.events.on('wake', () => {
      this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
      this.buildUI();
      if (AudioManager.shouldPlayMusic()) MusicManager.play('viking-music');
    });

    this.events.on('resume', () => {
      this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
      this.buildUI();
      if (AudioManager.shouldPlayMusic()) MusicManager.play('viking-music');
    });
  }

  buildUI() {
    this.children.removeAll();

    const { width, height } = this.scale;

    const progress = parseInt(localStorage.getItem('vikingCampaignProgress') || '1');
    this.registry.set('vikingCampaignProgress', progress);

    const globalDifficulty = localStorage.getItem('campaignDifficulty') || 'normal';

    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);

    const titleFontSize = Math.max(18, Math.min(38, width * 0.04));
    const subtitleFS = Math.max(10, Math.min(16, width * 0.018));
    const progressFS = Math.max(9, Math.min(12, width * 0.013));

    const title = this.add.text(width / 2, height * 0.1, 'VIKING CAMPAIGN', {
      fontSize: `${titleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#87CEEB',
      stroke: '#2C3E50',
      strokeThickness: Math.max(3, titleFontSize * 0.16),
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(width / 2, height * 0.2, 'with Erik the Adequate', {
      fontSize: `${subtitleFS}px`,
      fontFamily: 'Arial',
      color: '#CCCCCC',
      fontStyle: 'italic',
    });
    subtitle.setOrigin(0.5);

    const progressText = this.add.text(width / 2, height * 0.26, `PROGRESS: ${progress - 1}/6 RAIDS WON`, {
      fontSize: `${progressFS}px`,
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    progressText.setOrigin(0.5);

    this.createGlobalDifficultyBar(width / 2, height * 0.32, globalDifficulty);

    const levels = [
      { num: 1, name: 'Raiding Party', desc: 'Tutorial: Train miners and berserkers' },
      { num: 2, name: 'Axe to Grind', desc: 'Destroy the Roman fort' },
      { num: 3, name: 'Frozen Stand', desc: 'Survive 3 minutes of alien waves' },
      { num: 4, name: "Thor's Chosen", desc: 'Limited units, use spells to win' },
      { num: 5, name: 'Two Front War', desc: 'Enemies attack from both sides' },
      { num: 6, name: 'Ragnarok', desc: 'Destroy the alien mothership' },
    ];

    const listTop = height * 0.38;
    const listBottom = height - Math.min(60, height * 0.12);
    const spacing = Math.min(76, (listBottom - listTop) / levels.length);
    const startY = listTop;

    levels.forEach((level, index) => {
      const y = startY + index * spacing;
      const isUnlocked = level.num <= progress;
      const isCompleted = level.num < progress;
      this.createLevelRow(width, y, level, isUnlocked, isCompleted);
    });

    const btnW = Math.min(190, (width - 40) / 2 - 10);
    const btnH = Math.min(44, height * 0.07);
    const gap = Math.min(20, width * 0.02);
    const totalBtnArea = btnW * 2 + gap;
    const startX = width / 2 - totalBtnArea / 2 + btnW / 2;
    const btnY = height - Math.min(50, height * 0.08);
    this.createBackButton(startX, btnY, btnW, btnH);
    this.createProfileButton(startX + btnW + gap, btnY, btnW, btnH);
  }

  createGlobalDifficultyBar(cx, cy, currentDiff) {
    const difficulties = ['easy', 'normal', 'hard'];
    const colors = { easy: 0x4CAF50, normal: 0x87CEEB, hard: 0xE53935 };
    const labels = { easy: 'EASY', normal: 'NORMAL', hard: 'HARD' };
    const btnW = Math.min(100, (cx * 0.8) / 3);
    const gap = Math.min(8, cx * 0.02);
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
      const key = `viking_${levelNum}_${diff}`;
      if (this.starMap && this.starMap[key]) {
        best = Math.max(best, this.starMap[key]);
      }
    });
    return best;
  }

  createLevelRow(width, y, level, isUnlocked, isCompleted) {
    const container = this.add.container(width / 2, y);

    const panel = this.add.rectangle(0, 0, 700, 66, isUnlocked ? 0x4A7BA7 : 0x555555, 0.8);
    panel.setStrokeStyle(3, isUnlocked ? 0x87CEEB : 0x888888);
    container.add(panel);

    if (isUnlocked) {
      panel.setInteractive({ useHandCursor: true });

      panel.on('pointerover', () => panel.setFillStyle(0x6A9BC7, 0.9));
      panel.on('pointerout', () => panel.setFillStyle(0x4A7BA7, 0.8));
      panel.on('pointerdown', () => {
        const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
        const perLevelMap = JSON.parse(localStorage.getItem('levelDifficulty_viking') || '{}');
        const chosenDiff = perLevelMap[level.num] || globalDiff;
        this.startLevel(level.num, chosenDiff);
      });
    }

    const levelText = this.add.text(-330, -10, `LEVEL ${level.num}: ${level.name}`, {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: isUnlocked ? '#FFFFFF' : '#888888',
    });
    container.add(levelText);

    const descText = this.add.text(-330, 12, level.desc, {
      fontSize: '12px',
      fontFamily: 'Arial',
      color: isUnlocked ? '#CCCCCC' : '#666666',
    });
    container.add(descText);

    if (isCompleted) {
      const bestStars = this.getBestStarsForLevel(level.num);
      for (let s = 1; s <= 3; s++) {
        const sx = 260 + (s - 2) * 18;
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
      const lock = this.add.text(320, 0, '🔒', { fontSize: '24px' });
      lock.setOrigin(0.5);
      container.add(lock);
    }

    if (isUnlocked) {
      const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
      const perLevelMap = JSON.parse(localStorage.getItem('levelDifficulty_viking') || '{}');
      const selectedDiff = perLevelMap[level.num] || globalDiff;

      const diffColors = { easy: '#4CAF50', normal: '#87CEEB', hard: '#E53935' };
      const diffBadge = this.add.text(230, 12, selectedDiff.toUpperCase(), {
        fontSize: '8px',
        fontFamily: 'Press Start 2P',
        color: diffColors[selectedDiff],
      });
      diffBadge.setOrigin(0.5);
      container.add(diffBadge);
    }
  }

  stopVikingMusic() {
    MusicManager.stop();
  }

  createBackButton(x, y, w = 190, h = 44) {
    const fontSize = Math.max(10, Math.min(18, w * 0.09));
    const backButton = this.add.rectangle(x, y, w, h, 0x8B4513);
    backButton.setInteractive({ useHandCursor: true });
    backButton.setStrokeStyle(3, 0xFFD700);

    const backText = this.add.text(x, y, 'BACK', {
      fontSize: `${fontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    backText.setOrigin(0.5);

    backButton.on('pointerover', () => backButton.setFillStyle(0xA0522D));
    backButton.on('pointerout', () => backButton.setFillStyle(0x8B4513));
    backButton.on('pointerdown', () => {
      this.stopVikingMusic();
      this.scene.start('MenuScene');
    });
  }

  createProfileButton(x, y, w = 190, h = 44) {
    const fontSize = Math.max(8, Math.min(14, w * 0.07));
    const button = this.add.rectangle(x, y, w, h, 0x1565C0);
    button.setStrokeStyle(3, 0x42A5F5);
    button.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, 'PROFILE', {
      fontSize: `${fontSize}px`,
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
    bg.setStrokeStyle(3, 0x87CEEB);
    overlay.add(bg);

    const title = this.add.text(0, -(height * 0.44) + 30, 'CAMPAIGN STARS PROFILE', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#87CEEB',
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

    const closeBtn = this.add.rectangle(0, height * 0.44 - 30, 160, 36, 0x4A7BA7);
    closeBtn.setStrokeStyle(2, 0x87CEEB);
    closeBtn.setInteractive({ useHandCursor: true });
    overlay.add(closeBtn);

    const closeTxt = this.add.text(0, height * 0.44 - 30, 'CLOSE', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    closeTxt.setOrigin(0.5);
    overlay.add(closeTxt);

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0x6A9BC7));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x4A7BA7));
    closeBtn.on('pointerdown', () => overlay.destroy());
  }

  startLevel(levelNum, difficulty) {
    this.registry.set('campaignLevel', levelNum);
    this.registry.set('vikingCampaign', true);
    this.registry.set('alienCampaign', false);

    const diff = difficulty || localStorage.getItem('campaignDifficulty') || 'normal';
    this.registry.set('campaignDifficulty', diff);

    this.stopVikingMusic();
    this.scene.start('VikingComicIntroScene');
  }

  shutdown() {}
}
