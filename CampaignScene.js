import Phaser from 'phaser';
import { AudioManager } from './AudioManager.js';
import { MusicManager } from './MusicManager.js';
import { getAllLevelStars } from './supabase.js';

export class CampaignScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignScene' });
  }

  preload() {
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
      MusicManager.play('roman-music');
    }

    this.input.once('pointerdown', () => {
      MusicManager.tryUnlock();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('roman-music');
      }
    });

    this.events.on('wake', () => {
      this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
      this.buildUI();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('roman-music');
      }
    });

    this.events.on('resume', () => {
      this.starMap = JSON.parse(localStorage.getItem('levelStars') || '{}');
      this.buildUI();
      if (AudioManager.shouldPlayMusic()) {
        MusicManager.play('roman-music');
      }
    });
  }

  buildUI() {
    this.children.removeAll();

    const { width, height } = this.scale;

    const rawValue = localStorage.getItem('campaignProgress');
    const unlockedLevel = parseInt(rawValue || '1');

    this.registry.set('campaignProgress', unlockedLevel);

    const globalDifficulty = localStorage.getItem('campaignDifficulty') || 'normal';

    const bg = this.add.image(width / 2, height / 2, 'generic-bg');
    bg.setDisplaySize(width, height);

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.3);
    overlay.setOrigin(0);

    const titleBanner = this.add.rectangle(width / 2, 50, width * 0.6, 80, 0x000000, 0.7);
    titleBanner.setStrokeStyle(3, 0xFFD700);

    const title = this.add.text(width / 2, 40, 'ROMAN CAMPAIGN', {
      fontSize: '38px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);

    const progressText = this.add.text(width / 2, 78, `PROGRESS: ${unlockedLevel - 1}/8 BATTLES WON`, {
      fontSize: '12px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 3,
    });
    progressText.setOrigin(0.5);

    this.createGlobalDifficultyBar(width / 2, 115, globalDifficulty, 'roman');

    const levels = [
      { num: 1, name: 'Basic Training', desc: 'Learn the basics', icon: '⚔️', x: 0.15, y: 0.75 },
      { num: 2, name: 'First Contact', desc: 'Face your first aliens', icon: '👽', x: 0.25, y: 0.55 },
      { num: 3, name: 'Hold the Line', desc: 'Survive the onslaught', icon: '🛡️', x: 0.40, y: 0.45 },
      { num: 4, name: 'The Gauntlet', desc: 'No mercy, no retreat', icon: '⚡', x: 0.55, y: 0.35 },
      { num: 5, name: 'Mana Mastery', desc: 'Master your spells', icon: '💎', x: 0.65, y: 0.50 },
      { num: 6, name: 'Behind Enemy Lines', desc: 'Stealth assault', icon: '🗡️', x: 0.75, y: 0.65 },
      { num: 7, name: 'Alien Onslaught', desc: 'Full-scale war', icon: '💥', x: 0.85, y: 0.50 },
      { num: 8, name: 'The Mothership', desc: 'Final confrontation', icon: '🛸', x: 0.90, y: 0.30 },
    ];

    this.drawCampaignPath(levels, unlockedLevel, width, height);

    levels.forEach((level) => {
      const x = width * level.x;
      const y = height * level.y;
      const isUnlocked = level.num <= unlockedLevel;
      const isCompleted = level.num < unlockedLevel;

      this.createMapLevelMarker(x, y, level, isUnlocked, isCompleted, 'roman');
    });

    this.createBottomButtons(width, height);
  }

  createGlobalDifficultyBar(cx, cy, currentDiff, campaignType) {
    const difficulties = ['easy', 'normal', 'hard'];
    const colors = { easy: 0x4CAF50, normal: 0xFFD700, hard: 0xE53935 };
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

      const btn = this.add.rectangle(bx, cy, btnW, 24, col, isSelected ? 0.9 : 0.3);
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

  drawCampaignPath(levels, unlockedLevel, width, height) {
    const graphics = this.add.graphics();

    for (let i = 0; i < levels.length - 1; i++) {
      const currentLevel = levels[i];
      const nextLevel = levels[i + 1];

      const x1 = width * currentLevel.x;
      const y1 = height * currentLevel.y;
      const x2 = width * nextLevel.x;
      const y2 = height * nextLevel.y;

      const isPathUnlocked = i + 1 < unlockedLevel;
      const pathColor = isPathUnlocked ? 0xFFD700 : 0x555555;
      const pathAlpha = isPathUnlocked ? 0.8 : 0.4;

      const dashLength = 20;
      const gapLength = 10;
      const distance = Phaser.Math.Distance.Between(x1, y1, x2, y2);
      const angle = Math.atan2(y2 - y1, x2 - x1);

      let currentDistance = 0;
      while (currentDistance < distance) {
        const dashEnd = Math.min(currentDistance + dashLength, distance);
        const startX = x1 + Math.cos(angle) * currentDistance;
        const startY = y1 + Math.sin(angle) * currentDistance;
        const endX = x1 + Math.cos(angle) * dashEnd;
        const endY = y1 + Math.sin(angle) * dashEnd;

        graphics.lineStyle(6, pathColor, pathAlpha);
        graphics.beginPath();
        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);
        graphics.strokePath();

        currentDistance += dashLength + gapLength;
      }
    }
  }

  getBestStarsForLevel(campaignType, levelNum) {
    let best = 0;
    ['easy', 'normal', 'hard'].forEach(diff => {
      const key = `${campaignType}_${levelNum}_${diff}`;
      if (this.starMap && this.starMap[key]) {
        best = Math.max(best, this.starMap[key]);
      }
    });
    return best;
  }

  createMapLevelMarker(x, y, level, isUnlocked, isCompleted, campaignType) {
    const container = this.add.container(x, y);

    const glowSize = isUnlocked ? 70 : 60;
    const glowColor = isCompleted ? 0x00FF00 : (isUnlocked ? 0xFFD700 : 0x333333);
    const glow = this.add.circle(0, 0, glowSize, glowColor, 0.2);
    container.add(glow);

    if (isUnlocked && !isCompleted) {
      this.tweens.add({
        targets: glow,
        scale: 1.2,
        alpha: 0.4,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    const markerSize = 55;
    const markerColor = isCompleted ? 0x4CAF50 : (isUnlocked ? 0x8B4513 : 0x2C2C2C);
    const marker = this.add.circle(0, 0, markerSize, markerColor, 0.9);
    marker.setStrokeStyle(4, isUnlocked ? 0xFFD700 : 0x555555);
    container.add(marker);

    const icon = this.add.text(0, -5, level.icon, {
      fontSize: '32px',
    });
    icon.setOrigin(0.5);
    container.add(icon);

    const numBadge = this.add.circle(30, -30, 18, 0x000000, 0.9);
    numBadge.setStrokeStyle(2, isUnlocked ? 0xFFD700 : 0x555555);
    container.add(numBadge);

    const numText = this.add.text(30, -30, level.num.toString(), {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: isUnlocked ? '#FFFFFF' : '#666666',
    });
    numText.setOrigin(0.5);
    container.add(numText);

    if (isCompleted) {
      const bestStars = this.getBestStarsForLevel(campaignType, level.num);
      const starRow = this.add.container(0, 42);
      for (let s = 1; s <= 3; s++) {
        const sx = (s - 2) * 20;
        const filled = s <= bestStars;
        const star = this.add.text(sx, 0, '★', {
          fontSize: '18px',
          color: filled ? '#FFD700' : '#444444',
          stroke: '#000000',
          strokeThickness: 2,
        });
        star.setOrigin(0.5);
        starRow.add(star);
      }
      container.add(starRow);
    }

    if (!isUnlocked) {
      const lock = this.add.text(0, 35, '🔒', {
        fontSize: '24px',
      });
      lock.setOrigin(0.5);
      container.add(lock);
    }

    let infoPanel = null;

    if (isUnlocked) {
      marker.setInteractive({ useHandCursor: true });

      marker.on('pointerover', () => {
        marker.setFillStyle(isCompleted ? 0x66BB6A : 0xA0522D, 0.9);
        container.setScale(1.1);

        const globalDifficulty = localStorage.getItem('campaignDifficulty') || 'normal';
        infoPanel = this.createLevelInfoPanel(x, y, level, campaignType, globalDifficulty);
      });

      marker.on('pointerout', () => {
        marker.setFillStyle(markerColor, 0.9);
        container.setScale(1);

        if (infoPanel) {
          infoPanel.destroy();
          infoPanel = null;
        }
      });

      marker.on('pointerdown', () => {
        if (infoPanel) {
          infoPanel.destroy();
          infoPanel = null;
        }
        this.tweens.add({
          targets: marker,
          scale: 0.9,
          duration: 100,
          yoyo: true,
          onComplete: () => {
            const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
            const perLevelKey = `levelDifficulty_roman`;
            const perLevelMap = JSON.parse(localStorage.getItem(perLevelKey) || '{}');
            const chosenDiff = perLevelMap[level.num] || globalDiff;
            this.startLevel(level.num, chosenDiff);
          }
        });
      });
    }
  }

  createLevelInfoPanel(x, y, level, campaignType, globalDifficulty) {
    const { width, height } = this.scale;

    let panelX = x + 110;
    let panelY = y;

    if (panelX + 260 > width - 20) {
      panelX = x - 110;
    }
    if (panelY + 180 > height - 20) {
      panelY = height - 200;
    }
    if (panelY < 140) {
      panelY = 140;
    }

    const container = this.add.container(panelX, panelY);
    container.setDepth(1000);

    const perLevelKey = `levelDifficulty_${campaignType}`;
    const perLevelMap = JSON.parse(localStorage.getItem(perLevelKey) || '{}');
    const selectedDiff = perLevelMap[level.num] || globalDifficulty;

    const panelBg = this.add.rectangle(0, 0, 250, 170, 0x000000, 0.95);
    panelBg.setStrokeStyle(3, 0xFFD700);
    container.add(panelBg);

    const nameText = this.add.text(0, -68, level.name, {
      fontSize: '12px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      align: 'center',
      wordWrap: { width: 230 }
    });
    nameText.setOrigin(0.5);
    container.add(nameText);

    const descText = this.add.text(0, -45, level.desc, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#CCCCCC',
      align: 'center',
      wordWrap: { width: 230 }
    });
    descText.setOrigin(0.5);
    container.add(descText);

    const starBreakdown = this.add.text(0, -22, this.getStarBreakdownText(campaignType, level.num), {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#AAAAAA',
      align: 'center',
    });
    starBreakdown.setOrigin(0.5);
    container.add(starBreakdown);

    const diffLabel = this.add.text(0, 2, 'DIFFICULTY:', {
      fontSize: '9px',
      fontFamily: 'Press Start 2P',
      color: '#888888',
    });
    diffLabel.setOrigin(0.5);
    container.add(diffLabel);

    const difficulties = ['easy', 'normal', 'hard'];
    const diffColors = { easy: 0x4CAF50, normal: 0xFFD700, hard: 0xE53935 };
    const diffLabels = { easy: 'EASY', normal: 'NRM', hard: 'HARD' };
    const btnW = 66;
    const gap = 5;
    const totalW = 3 * btnW + 2 * gap;

    difficulties.forEach((diff, i) => {
      const bx = -totalW / 2 + i * (btnW + gap) + btnW / 2;
      const by = 28;
      const isSelected = diff === selectedDiff;
      const col = diffColors[diff];

      const btn = this.add.rectangle(bx, by, btnW, 22, col, isSelected ? 0.9 : 0.25);
      btn.setStrokeStyle(isSelected ? 2 : 1, col);
      btn.setInteractive({ useHandCursor: true });

      const lbl = this.add.text(bx, by, diffLabels[diff], {
        fontSize: '8px',
        fontFamily: 'Press Start 2P',
        color: isSelected ? '#FFFFFF' : '#777777',
      });
      lbl.setOrigin(0.5);

      container.add(btn);
      container.add(lbl);

      btn.on('pointerdown', (pointer) => {
        pointer.event.stopPropagation();
        perLevelMap[level.num] = diff;
        localStorage.setItem(perLevelKey, JSON.stringify(perLevelMap));
        container.destroy();
        const globalDiff = localStorage.getItem('campaignDifficulty') || 'normal';
        const newPanel = this.createLevelInfoPanel(x, y, level, campaignType, globalDiff);
      });
    });

    const hintText = this.add.text(0, 62, 'Click marker to start!', {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#AAAAAA',
      align: 'center',
    });
    hintText.setOrigin(0.5);
    container.add(hintText);

    const diffDescriptions = {
      easy: { text: '+ 100 gold start', color: '#4CAF50' },
      normal: { text: 'Standard challenge', color: '#FFD700' },
      hard: { text: 'Faster enemies, less gold', color: '#E53935' },
    };
    const dd = diffDescriptions[selectedDiff];
    const diffDesc = this.add.text(0, 48, dd.text, {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: dd.color,
      align: 'center',
    });
    diffDesc.setOrigin(0.5);
    container.add(diffDesc);

    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });

    return container;
  }

  getStarBreakdownText(campaignType, levelNum) {
    const parts = [];
    const labels = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
    ['easy', 'normal', 'hard'].forEach(diff => {
      const key = `${campaignType}_${levelNum}_${diff}`;
      const stars = this.starMap && this.starMap[key];
      if (stars) {
        parts.push(`${labels[diff]}: ${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}`);
      }
    });
    return parts.length > 0 ? parts.join('  ') : 'Not yet attempted';
  }

  stopRomanMusic() {
    MusicManager.stop();
  }

  createBottomButtons(width, height) {
    this.createBackButton(width / 2 - 230, height - 50);
    this.createResetButton(width / 2 - 10, height - 50);
    this.createProfileButton(width / 2 + 210, height - 50);
  }

  createBackButton(x, y) {
    const button = this.add.rectangle(x, y, 190, 44, 0x8B4513);
    button.setStrokeStyle(3, 0xFFD700);
    button.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, 'BACK', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0xA0522D));
    button.on('pointerout', () => button.setFillStyle(0x8B4513));
    button.on('pointerdown', () => {
      this.stopRomanMusic();
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  createResetButton(x, y) {
    const button = this.add.rectangle(x, y, 190, 44, 0xCC0000);
    button.setStrokeStyle(3, 0xFF0000);
    button.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, 'RESET', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5);

    button.on('pointerover', () => button.setFillStyle(0xFF0000));
    button.on('pointerout', () => button.setFillStyle(0xCC0000));
    button.on('pointerdown', () => {
      localStorage.setItem('campaignProgress', '1');
      this.buildUI();
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
    button.on('pointerdown', () => {
      this.showProfileOverlay();
    });
  }

  showProfileOverlay() {
    const { width, height } = this.scale;
    const overlay = this.add.container(width / 2, height / 2);
    overlay.setDepth(2000);

    const bg = this.add.rectangle(0, 0, width * 0.92, height * 0.88, 0x000000, 0.95);
    bg.setStrokeStyle(3, 0xFFD700);
    overlay.add(bg);

    const title = this.add.text(0, -(height * 0.44) + 30, 'CAMPAIGN STARS PROFILE', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
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

    const closeBtn = this.add.rectangle(0, height * 0.44 - 30, 160, 36, 0x8B4513);
    closeBtn.setStrokeStyle(2, 0xFFD700);
    closeBtn.setInteractive({ useHandCursor: true });
    overlay.add(closeBtn);

    const closeTxt = this.add.text(0, height * 0.44 - 30, 'CLOSE', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    closeTxt.setOrigin(0.5);
    overlay.add(closeTxt);

    closeBtn.on('pointerover', () => closeBtn.setFillStyle(0xA0522D));
    closeBtn.on('pointerout', () => closeBtn.setFillStyle(0x8B4513));
    closeBtn.on('pointerdown', () => overlay.destroy());
  }

  startLevel(levelNum, difficulty) {
    this.stopRomanMusic();
    const diff = difficulty || localStorage.getItem('campaignDifficulty') || 'normal';
    this.registry.set('campaignDifficulty', diff);
    this.registry.set('campaignLevel', levelNum);
    this.registry.set('vikingCampaign', false);
    this.registry.set('alienCampaign', false);
    this.scene.start('ComicIntroScene', { levelNum });
  }

  shutdown() {}
}
