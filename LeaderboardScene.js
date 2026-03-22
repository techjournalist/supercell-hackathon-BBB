import Phaser from 'phaser';
import { getLeaderboard } from './supabase.js';

export class LeaderboardScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LeaderboardScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Background
    const bg = this.add.rectangle(0, 0, width, height, 0x1a0033);
    bg.setOrigin(0);

    const ground = this.add.rectangle(0, height * 0.7, width, height * 0.3, 0x4A3C2F);
    ground.setOrigin(0);

    // Responsive font helpers
    const titleSize = Math.max(18, Math.min(width * 0.05, 48));
    const subtitleSize = Math.max(10, Math.min(width * 0.02, 18));
    const strokeThick = Math.max(2, Math.min(width * 0.006, 6));

    // Title
    const title = this.add.text(width / 2, height * 0.08, 'GLOBAL LEADERBOARD', {
      fontSize: `${titleSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: strokeThick,
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, height * 0.18, 'Campaign Completion Times', {
      fontSize: `${subtitleSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    subtitle.setOrigin(0.5);

    // Tab selection
    this.currentTab = 'roman';
    this.createTabs(width, height);

    // Leaderboard content area
    this.contentYRatio = 0.32;
    this.createLeaderboardContent(width, height);

    // Back button
    this.createBackButton(width, height);

    // Load leaderboard data
    this.loadLeaderboardData();
  }

  createTabs(width, height) {
    const tabs = [
      { id: 'roman', label: 'ROMAN', color: 0xFFD700 },
      { id: 'viking', label: 'VIKING', color: 0x00D4FF },
      { id: 'alien', label: 'ALIEN', color: 0x39FF14 },
    ];

    const tabWidth = Math.min(200, width * 0.2);
    const tabHeight = Math.min(50, height * 0.1);
    const spacing = Math.min(20, width * 0.02);
    const startX = width / 2 - ((tabWidth + spacing) * tabs.length - spacing) / 2;
    const tabFontSize = Math.max(8, Math.min(width * 0.018, 18));

    this.tabs = {};

    tabs.forEach((tab, index) => {
      const x = startX + (tabWidth + spacing) * index;
      const y = height * 0.26;

      const isActive = tab.id === this.currentTab;
      const bgColor = isActive ? tab.color : 0x555555;

      const bg = this.add.rectangle(x, y, tabWidth, tabHeight, bgColor);
      bg.setStrokeStyle(Math.max(1, Math.min(width * 0.003, 3)), tab.color);

      const text = this.add.text(x, y, tab.label, {
        fontSize: `${tabFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: isActive ? '#000000' : '#FFFFFF',
      });
      text.setOrigin(0.5);

      // Make interactive
      bg.setInteractive({ useHandCursor: true });

      bg.on('pointerover', () => {
        if (tab.id !== this.currentTab) {
          bg.setFillStyle(0x777777);
        }
      });

      bg.on('pointerout', () => {
        if (tab.id !== this.currentTab) {
          bg.setFillStyle(0x555555);
        }
      });

      bg.on('pointerdown', () => {
        this.switchTab(tab.id);
      });

      this.tabs[tab.id] = { bg, text, color: tab.color };
    });
  }

  switchTab(tabId) {
    if (this.currentTab === tabId) return;

    // Update old tab
    const oldTab = this.tabs[this.currentTab];
    oldTab.bg.setFillStyle(0x555555);
    oldTab.text.setColor('#FFFFFF');

    // Update new tab
    this.currentTab = tabId;
    const newTab = this.tabs[tabId];
    newTab.bg.setFillStyle(newTab.color);
    newTab.text.setColor('#000000');

    // Refresh content
    this.refreshLeaderboardContent();
  }

  createLeaderboardContent(width, height) {
    // Content container
    const contentY = height * this.contentYRatio;
    const contentHeight = height - contentY - height * 0.18;
    const panelWidth = Math.min(900, width * 0.92);
    const panel = this.add.rectangle(width / 2, contentY + contentHeight / 2, panelWidth, contentHeight, 0x2C2416);
    panel.setStrokeStyle(Math.max(2, Math.min(width * 0.004, 4)), 0xFFD700);

    // Headers
    const headerY = contentY + contentHeight * 0.08;
    const headerFontSize = Math.max(8, Math.min(width * 0.016, 16));

    // Column offsets as proportion of panel width
    const hw = panelWidth / 2;
    const headers = [
      { text: 'RANK',   x: width / 2 - hw * 0.84 },
      { text: 'PLAYER', x: width / 2 - hw * 0.40 },
      { text: 'SCORE',  x: width / 2 + hw * 0.04 },
      { text: 'KILLS',  x: width / 2 + hw * 0.40 },
      { text: 'DATE',   x: width / 2 + hw * 0.80 },
    ];

    this.headerTexts = [];
    headers.forEach(header => {
      const text = this.add.text(header.x, headerY, header.text, {
        fontSize: `${headerFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      });
      text.setOrigin(0.5);
      this.headerTexts.push(text);
    });

    // Entry container (will be populated with data)
    this.entryContainer = this.add.container(0, 0);
  }

  async loadLeaderboardData() {
    // Show loading indicator
    const { width, height } = this.scale;
    const contentY = height * this.contentYRatio;
    const loadingFontSize = Math.max(10, Math.min(width * 0.02, 18));
    const loadingText = this.add.text(width / 2, contentY + height * 0.2, 'Loading...', {
      fontSize: `${loadingFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#888888',
    });
    loadingText.setOrigin(0.5);

    // Initialize with empty data
    this.leaderboardData = { roman: [], viking: [], alien: [] };

    try {
      const all = await getLeaderboard(null, 50);

      const mapEntry = e => ({
        player: e.display_name || 'Commander',
        time: e.time_seconds || 0,
        score: e.score || 0,
        kills: e.enemies_killed || 0,
        date: e.created_at ? new Date(e.created_at).toLocaleDateString() : '---',
        faction: e.faction,
      });

      this.leaderboardData = {
        roman: all.filter(e => e.faction === 'roman').map(mapEntry),
        viking: all.filter(e => e.faction === 'viking').map(mapEntry),
        alien: all.filter(e => e.faction === 'alien').map(mapEntry),
      };
    } catch (e) {
      // Fall back to localStorage on error
      this.leaderboardData = {
        roman: this.getLocalLeaderboard('roman'),
        viking: this.getLocalLeaderboard('viking'),
        alien: this.getLocalLeaderboard('alien'),
      };
    }

    if (loadingText.active) loadingText.destroy();
    this.refreshLeaderboardContent();
  }

  getLocalLeaderboard(campaign) {
    const key = `leaderboard_${campaign}`;
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
    return Array(10).fill({ player: '---', time: 0, date: '---' });
  }

  refreshLeaderboardContent() {
    // Clear existing entries
    this.entryContainer.removeAll(true);

    const data = this.leaderboardData[this.currentTab];
    const { width, height } = this.scale;
    const contentY = height * this.contentYRatio;
    const contentHeight = height - contentY - height * 0.18;
    const panelWidth = Math.min(900, width * 0.92);
    const hw = panelWidth / 2;
    const startY = contentY + contentHeight * 0.18;

    // Responsive font sizes for entries
    const rankFontSize = Math.max(10, Math.min(width * 0.02, 18));
    const playerFontSize = Math.max(8, Math.min(width * 0.015, 14));
    const scoreFontSize = Math.max(9, Math.min(width * 0.017, 16));
    const killsFontSize = Math.max(9, Math.min(width * 0.017, 16));
    const dateFontSize = Math.max(7, Math.min(width * 0.013, 12));
    const emptyFontSize = Math.max(9, Math.min(width * 0.017, 16));

    // Row spacing responsive to available space
    const maxRows = 10;
    const availableHeight = contentHeight * 0.7;
    const rowSpacing = Math.min(45, availableHeight / maxRows);

    if (data.length === 0) {
      const empty = this.add.text(width / 2, startY + rowSpacing * 1.5, 'No entries yet.\nPlay a game to appear here!', {
        fontSize: `${emptyFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#666666',
        align: 'center',
      });
      empty.setOrigin(0.5);
      this.entryContainer.add(empty);
    }

    data.slice(0, 10).forEach((entry, index) => {
      const y = startY + index * rowSpacing;

      const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFFFFF';
      const rank = this.add.text(width / 2 - hw * 0.84, y, `${index + 1}`, {
        fontSize: `${rankFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: rankColor,
      });
      rank.setOrigin(0.5);
      this.entryContainer.add(rank);

      const player = this.add.text(width / 2 - hw * 0.40, y, entry.player || 'Commander', {
        fontSize: `${playerFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
      });
      player.setOrigin(0.5);
      this.entryContainer.add(player);

      const scoreText = entry.score > 0 ? `${entry.score}` : '---';
      const score = this.add.text(width / 2 + hw * 0.04, y, scoreText, {
        fontSize: `${scoreFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      });
      score.setOrigin(0.5);
      this.entryContainer.add(score);

      const killsText = entry.kills !== undefined ? `${entry.kills}` : '---';
      const kills = this.add.text(width / 2 + hw * 0.40, y, killsText, {
        fontSize: `${killsFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#FF5252',
      });
      kills.setOrigin(0.5);
      this.entryContainer.add(kills);

      const date = this.add.text(width / 2 + hw * 0.80, y, entry.date || '---', {
        fontSize: `${dateFontSize}px`,
        fontFamily: 'Arial',
        color: '#CCCCCC',
      });
      date.setOrigin(0.5);
      this.entryContainer.add(date);
    });

    // Show player's best time if they have one
    this.showPlayerBestTime(width, height);
  }

  showPlayerBestTime(width, height) {
    // Check if player has a time for this campaign
    const playerTime = this.getPlayerTime(this.currentTab);

    if (playerTime) {
      const contentY = height * this.contentYRatio;
      const contentHeight = height - contentY - height * 0.18;
      const y = contentY + contentHeight * 0.9;

      const bestPanelWidth = Math.min(700, width * 0.78);
      const bestPanelHeight = Math.min(60, height * 0.1);
      const bestFontSize = Math.max(10, Math.min(width * 0.02, 18));

      const bg = this.add.rectangle(width / 2, y, bestPanelWidth, bestPanelHeight, 0x4A3C2F);
      bg.setStrokeStyle(Math.max(1, Math.min(width * 0.003, 3)), 0xFFD700);
      this.entryContainer.add(bg);

      const text = this.add.text(width / 2, y, `YOUR BEST: ${this.formatTime(playerTime.time)} - Rank: ${playerTime.rank}`, {
        fontSize: `${bestFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      });
      text.setOrigin(0.5);
      this.entryContainer.add(text);
    }
  }

  getPlayerTime(campaign) {
    const key = `player_time_${campaign}`;
    const time = localStorage.getItem(key);

    if (time) {
      const leaderboard = this.leaderboardData[campaign];
      const playerTime = parseFloat(time);

      // Find rank
      let rank = 1;
      for (let entry of leaderboard) {
        if (entry.time > 0 && entry.time < playerTime) {
          rank++;
        }
      }

      return { time: playerTime, rank };
    }

    return null;
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

  createBackButton(width, height) {
    const btnWidth = Math.min(200, width * 0.22);
    const btnHeight = Math.min(50, height * 0.1);
    const btnFontSize = Math.max(10, Math.min(width * 0.02, 20));
    const x = width / 2;
    const y = height * 0.9;

    const button = this.add.rectangle(x, y, btnWidth, btnHeight, 0x8B4513);
    button.setStrokeStyle(Math.max(1, Math.min(width * 0.003, 3)), 0xFFD700);
    button.setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, 'BACK', {
      fontSize: `${btnFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    text.setOrigin(0.5);

    button.on('pointerover', () => {
      button.setFillStyle(0xA0522D);
    });

    button.on('pointerout', () => {
      button.setFillStyle(0x8B4513);
    });

    button.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  // Static method to add a completion time to leaderboard
  static addCompletionTime(campaign, playerName, timeInSeconds) {
    const key = `leaderboard_${campaign}`;
    const stored = localStorage.getItem(key);

    let leaderboard = stored ? JSON.parse(stored) : [];

    // Add new entry
    const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    leaderboard.push({
      player: playerName,
      time: timeInSeconds,
      date: date,
    });

    // Sort by time (fastest first)
    leaderboard.sort((a, b) => {
      if (a.time === 0) return 1;
      if (b.time === 0) return -1;
      return a.time - b.time;
    });

    // Keep top 100
    leaderboard = leaderboard.slice(0, 100);

    // Save
    localStorage.setItem(key, JSON.stringify(leaderboard));

    // Save player's best time
    const playerKey = `player_time_${campaign}`;
    const currentBest = localStorage.getItem(playerKey);
    if (!currentBest || timeInSeconds < parseFloat(currentBest)) {
      localStorage.setItem(playerKey, timeInSeconds.toString());
    }


  }
}
