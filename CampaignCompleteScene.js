import Phaser from 'phaser';
import { LeaderboardScene } from './LeaderboardScene.js';

export class CampaignCompleteScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CampaignCompleteScene' });
  }

  preload() {
    // Load victory background
    this.load.image('victory-bg', 'https://rosebud.ai/assets/victory-screen.jpeg?P3a2');
  }

  create(data) {
    const { width, height } = this.scale;
    const { campaign, completionTime } = data; // 'roman', 'viking', or 'alien'

    this.campaign = campaign;
    this.completionTime = completionTime || 0;

    // Check for personal best before saving
    const playerName = localStorage.getItem('playerName') || 'Player';
    const previousBest = parseFloat(localStorage.getItem(`player_time_${campaign}`) || '999999');
    this.isNewPersonalBest = this.completionTime > 0 && this.completionTime < previousBest;

    // Save to leaderboard (using default player name)
    if (this.completionTime > 0) {
      LeaderboardScene.addCompletionTime(campaign, playerName, this.completionTime);
    }

    // Check if made top 10
    const leaderboard = this.getLeaderboard(campaign);
    this.madeTop10 = leaderboard.slice(0, 10).some(entry =>
      entry.player === playerName && entry.time === this.completionTime
    );

    // Fade in
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Victory background image
    const bg = this.add.image(width / 2, height / 2, 'victory-bg');
    bg.setDisplaySize(width, height);

    // Add semi-transparent overlay
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.3);
    overlay.setOrigin(0);

    // Create starfield effect
    this.createStarfield(width, height);

    // Massive gold particle explosion
    this.createVictoryExplosion(width, height);

    // Campaign-specific colors and text
    let campaignColor, campaignTitle, campaignSubtitle;
    if (campaign === 'viking') {
      campaignColor = '#00D4FF'; // Ice blue
      campaignTitle = 'VIKING CAMPAIGN';
      campaignSubtitle = 'VALHALLA AWAITS!';
    } else if (campaign === 'alien') {
      campaignColor = '#39FF14'; // Neon green
      campaignTitle = 'ALIEN CAMPAIGN';
      campaignSubtitle = 'GALAXY CONQUERED!';
    } else {
      campaignColor = '#FFD700'; // Gold
      campaignTitle = 'ROMAN CAMPAIGN';
      campaignSubtitle = 'GLORY TO ROME!';
    }

    // Responsive font sizes
    const completeFontSize = Math.max(24, Math.min(width * 0.06, 72));
    const titleFontSize = Math.max(16, Math.min(width * 0.035, 36));
    const subtitleFontSize = Math.max(14, Math.min(width * 0.028, 28));
    const strokeThick = Math.max(4, Math.min(width * 0.008, 10));
    const strokeMed = Math.max(3, Math.min(width * 0.005, 6));
    const strokeThin = Math.max(2, Math.min(width * 0.004, 5));

    // Big CAMPAIGN COMPLETE text with dramatic entrance
    const completeText = this.add.text(width / 2, -100, 'CAMPAIGN\nCOMPLETE!', {
      fontSize: `${completeFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: campaignColor,
      stroke: '#000000',
      strokeThickness: strokeThick,
      align: 'center',
      lineSpacing: Math.max(8, width * 0.015),
    });
    completeText.setOrigin(0.5);

    // Animate text dropping in with bounce
    this.tweens.add({
      targets: completeText,
      y: height * 0.25,
      duration: 1500,
      ease: 'Bounce.easeOut',
    });

    // Campaign title appears after delay
    const titleText = this.add.text(width / 2, height * 0.48, campaignTitle, {
      fontSize: `${titleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: strokeMed,
    });
    titleText.setOrigin(0.5);
    titleText.setAlpha(0);

    this.tweens.add({
      targets: titleText,
      alpha: 1,
      duration: 1000,
      delay: 1500,
    });

    // Subtitle with glow pulse
    const subtitleText = this.add.text(width / 2, height * 0.58, campaignSubtitle, {
      fontSize: `${subtitleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: campaignColor,
      stroke: '#000000',
      strokeThickness: strokeThin,
    });
    subtitleText.setOrigin(0.5);
    subtitleText.setAlpha(0);

    this.tweens.add({
      targets: subtitleText,
      alpha: 1,
      duration: 1000,
      delay: 2000,
    });

    // Pulsing glow effect
    this.tweens.add({
      targets: subtitleText,
      scale: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 2500,
    });

    // Stats panel
    this.time.delayedCall(2500, () => {
      this.showStatsPanel(width, height, campaign);
    });

    // Show achievement notifications
    this.time.delayedCall(3500, () => {
      this.showAchievementNotifications(width, height);
    });

    // Animated trophies
    this.time.delayedCall(3000, () => {
      this.createFloatingTrophies(width, height);
    });

    // Buttons appear last
    this.time.delayedCall(4000, () => {
      this.createButtons(width, height);
    });

    // Play epic victory sound (placeholder - using synth)
    this.playVictoryFanfare();
  }

  createStarfield(width, height) {
    // Animated starfield background
    for (let i = 0; i < 100; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const star = this.add.circle(x, y, Phaser.Math.Between(1, 3), 0xFFFFFF, 0.8);

      this.tweens.add({
        targets: star,
        alpha: 0.2,
        duration: Phaser.Math.Between(1000, 3000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createVictoryExplosion(width, height) {
    // Multiple particle explosions
    const colors = [0xFFD700, 0xFFA500, 0xFF6B00, 0xFFFFFF];

    for (let i = 0; i < 5; i++) {
      this.time.delayedCall(i * 300, () => {
        const x = width / 2 + Phaser.Math.Between(-200, 200);
        const y = height / 2 + Phaser.Math.Between(-100, 100);

        for (let j = 0; j < 30; j++) {
          const particle = this.add.circle(x, y, Phaser.Math.Between(4, 8), Phaser.Math.RND.pick(colors));
          const angle = Phaser.Math.Between(0, 360);
          const speed = Phaser.Math.Between(200, 400);

          this.tweens.add({
            targets: particle,
            x: x + Math.cos(angle) * speed,
            y: y + Math.sin(angle) * speed,
            alpha: 0,
            duration: 2000,
            ease: 'Cubic.easeOut',
            onComplete: () => particle.destroy(),
          });
        }
      });
    }
  }

  showStatsPanel(width, height, campaign) {
    const panelW = Math.min(700, width * 0.75);
    const statFontSize = Math.max(10, Math.min(width * 0.016, 16));
    const statTitleFontSize = Math.max(14, Math.min(width * 0.024, 24));
    const statSpacing = Math.max(22, Math.min(height * 0.065, 35));
    const panelH = Math.max(140, statSpacing * 4 + statTitleFontSize + 60);
    const panelCenterY = height * 0.62 + panelH * 0.3;

    const panel = this.add.rectangle(width / 2, panelCenterY, panelW, panelH, 0x1a0033, 0.9);
    panel.setStrokeStyle(Math.max(2, width * 0.003), 0xFFD700);
    panel.setAlpha(0);

    this.tweens.add({
      targets: panel,
      alpha: 1,
      duration: 500,
    });

    const statsTitleY = panelCenterY - panelH / 2 + statTitleFontSize + 10;
    const statsTitle = this.add.text(width / 2, statsTitleY, 'CAMPAIGN STATISTICS', {
      fontSize: `${statTitleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    statsTitle.setOrigin(0.5);
    statsTitle.setAlpha(0);

    this.tweens.add({
      targets: statsTitle,
      alpha: 1,
      duration: 500,
      delay: 200,
    });

    const stats = [
      '8 LEVELS CONQUERED',
      `TIME: ${this.formatTime(this.completionTime)}`,
      'EMPIRE SECURED',
      'LEGEND ACHIEVED'
    ];

    const statsStartY = statsTitleY + statTitleFontSize + 10;

    stats.forEach((stat, index) => {
      const text = this.add.text(width / 2, statsStartY + (index * statSpacing), stat, {
        fontSize: `${statFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: index === 1 ? '#00FF00' : '#FFFFFF',
      });
      text.setOrigin(0.5);
      text.setAlpha(0);

      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 500,
        delay: 400 + (index * 200),
      });
    });
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  createFloatingTrophies(width, height) {
    const trophyFontSize = Math.max(36, Math.min(width * 0.06, 80));
    const offsetX = width * 0.38;
    const topY = height * 0.22;
    const bottomY = height * 0.78;

    const trophyPositions = [
      { x: width / 2 - offsetX, y: topY },
      { x: width / 2 + offsetX, y: topY },
      { x: width / 2 - offsetX, y: bottomY },
      { x: width / 2 + offsetX, y: bottomY },
    ];

    trophyPositions.forEach((pos, index) => {
      const trophy = this.add.text(pos.x, pos.y - height * 0.04, '🏆', {
        fontSize: `${trophyFontSize}px`
      });
      trophy.setOrigin(0.5);
      trophy.setAlpha(0);
      trophy.setScale(0);

      this.tweens.add({
        targets: trophy,
        alpha: 1,
        scale: 1,
        duration: 600,
        ease: 'Back.easeOut',
        delay: index * 150,
      });

      // Floating animation
      this.tweens.add({
        targets: trophy,
        y: pos.y - height * 0.07,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: index * 150 + 600,
      });

      // Rotation
      this.tweens.add({
        targets: trophy,
        angle: 360,
        duration: 4000,
        repeat: -1,
        ease: 'Linear',
        delay: index * 150 + 600,
      });
    });
  }

  createButtons(width, height) {
    const btnW = Math.min(300, width * 0.28);
    const btnH = Math.max(40, Math.min(70, height * 0.12));
    const btnY = height - btnH * 0.9;
    const btnSpacing = Math.min(330, width * 0.33);

    // View Leaderboard button
    const leaderboardButton = this.createButton(
      width / 2 - btnSpacing,
      btnY,
      btnW,
      btnH,
      'VIEW LEADERBOARD',
      () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('LeaderboardScene');
        });
      }
    );

    // Try another campaign button
    const campaignButton = this.createButton(
      width / 2,
      btnY,
      btnW,
      btnH,
      'TRY ANOTHER',
      () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene');
        });
      }
    );

    // Main menu button
    const menuButton = this.createButton(
      width / 2 + btnSpacing,
      btnY,
      Math.min(250, width * 0.24),
      btnH,
      'MAIN MENU',
      () => {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
          this.scene.start('MenuScene');
        });
      }
    );

    // Animate buttons in
    [leaderboardButton.bg, leaderboardButton.text].forEach(obj => {
      obj.setAlpha(0);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 500,
      });
    });

    [campaignButton.bg, campaignButton.text].forEach(obj => {
      obj.setAlpha(0);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 500,
        delay: 100,
      });
    });

    [menuButton.bg, menuButton.text].forEach(obj => {
      obj.setAlpha(0);
      this.tweens.add({
        targets: obj,
        alpha: 1,
        duration: 500,
        delay: 200,
      });
    });
  }

  createButton(x, y, bWidth, bHeight, text, callback) {
    const btnFontSize = Math.max(10, Math.min(bWidth * 0.065, 20));
    const strokeW = Math.max(2, Math.min(bWidth * 0.013, 4));

    const bg = this.add.rectangle(x, y, bWidth, bHeight, 0x8B4513);
    bg.setStrokeStyle(strokeW, 0xFFD700);
    bg.setInteractive({ useHandCursor: true });

    const buttonText = this.add.text(x, y, text, {
      fontSize: `${btnFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      align: 'center',
      wordWrap: { width: bWidth - 20 },
    });
    buttonText.setOrigin(0.5);

    bg.on('pointerover', () => {
      bg.setFillStyle(0xA0522D);
      this.tweens.add({
        targets: [bg, buttonText],
        scale: 1.05,
        duration: 100,
      });
    });

    bg.on('pointerout', () => {
      bg.setFillStyle(0x8B4513);
      this.tweens.add({
        targets: [bg, buttonText],
        scale: 1,
        duration: 100,
      });
    });

    bg.on('pointerdown', callback);

    return { bg, text: buttonText };
  }

  getLeaderboard(campaign) {
    const key = `leaderboard_${campaign}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  }

  showAchievementNotifications(width, height) {
    let notificationY = height * 0.85;

    // Personal best notification
    if (this.isNewPersonalBest) {
      this.showNotification(width / 2, notificationY, '🎯 NEW PERSONAL BEST!', '#FFD700');
      notificationY += Math.max(40, height * 0.1);
    }

    // Top 10 notification
    if (this.madeTop10) {
      this.showNotification(width / 2, notificationY, '⭐ TOP 10 LEADERBOARD!', '#00FF00');
    }
  }

  showNotification(x, y, text, color) {
    const { width, height } = this.scale;
    const notifW = Math.min(500, width * 0.6);
    const notifH = Math.max(35, height * 0.09);
    const notifFontSize = Math.max(10, Math.min(width * 0.02, 20));
    const strokeW = Math.max(2, Math.min(width * 0.003, 3));

    const bg = this.add.rectangle(x, y, notifW, notifH, 0x000000, 0.8);
    bg.setStrokeStyle(strokeW, color);
    bg.setAlpha(0);

    const notifText = this.add.text(x, y, text, {
      fontSize: `${notifFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: color,
    });
    notifText.setOrigin(0.5);
    notifText.setAlpha(0);

    // Slide in from right
    bg.x = x + 600;
    notifText.x = x + 600;

    this.tweens.add({
      targets: [bg, notifText],
      x: x,
      alpha: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Pulse effect
    this.tweens.add({
      targets: [bg, notifText],
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 500,
    });
  }

  playVictoryFanfare() {
    // Epic ascending notes (placeholder - would use proper audio in production)
    const notes = ['C4', 'E4', 'G4', 'C5'];
    notes.forEach((note, i) => {
      this.time.delayedCall(i * 200, () => {
        // Audio would play here if Tone.js audio system was set up
        // For now, this is a placeholder
      });
    });
  }
}
