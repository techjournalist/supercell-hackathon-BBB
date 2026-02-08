import Phaser from 'phaser';

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
    
    // Title
    const title = this.add.text(width / 2, 60, 'GLOBAL LEADERBOARD', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#8B4513',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Subtitle
    const subtitle = this.add.text(width / 2, 120, 'Campaign Completion Times', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    subtitle.setOrigin(0.5);
    
    // Tab selection
    this.currentTab = 'roman';
    this.createTabs(width);
    
    // Leaderboard content area
    this.contentY = 220;
    this.createLeaderboardContent(width, height);
    
    // Back button
    this.createBackButton(width / 2, height - 80);
    
    // Load leaderboard data
    this.loadLeaderboardData();
  }
  
  createTabs(width) {
    const tabs = [
      { id: 'roman', label: 'ROMAN', color: 0xFFD700 },
      { id: 'viking', label: 'VIKING', color: 0x00D4FF },
      { id: 'alien', label: 'ALIEN', color: 0x39FF14 },
    ];
    
    const tabWidth = 200;
    const tabHeight = 50;
    const spacing = 20;
    const startX = width / 2 - ((tabWidth + spacing) * tabs.length - spacing) / 2;
    
    this.tabs = {};
    
    tabs.forEach((tab, index) => {
      const x = startX + (tabWidth + spacing) * index;
      const y = 170;
      
      const isActive = tab.id === this.currentTab;
      const bgColor = isActive ? tab.color : 0x555555;
      
      const bg = this.add.rectangle(x, y, tabWidth, tabHeight, bgColor);
      bg.setStrokeStyle(3, tab.color);
      
      const text = this.add.text(x, y, tab.label, {
        fontSize: '18px',
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
    const contentHeight = height - this.contentY - 150;
    const panel = this.add.rectangle(width / 2, this.contentY + contentHeight / 2, 900, contentHeight, 0x2C2416);
    panel.setStrokeStyle(4, 0xFFD700);
    
    // Headers
    const headerY = this.contentY + 40;
    const headers = [
      { text: 'RANK', x: width / 2 - 350 },
      { text: 'PLAYER', x: width / 2 - 150 },
      { text: 'TIME', x: width / 2 + 150 },
      { text: 'DATE', x: width / 2 + 350 },
    ];
    
    this.headerTexts = [];
    headers.forEach(header => {
      const text = this.add.text(header.x, headerY, header.text, {
        fontSize: '16px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
      });
      text.setOrigin(0.5);
      this.headerTexts.push(text);
    });
    
    // Entry container (will be populated with data)
    this.entryContainer = this.add.container(0, 0);
  }
  
  loadLeaderboardData() {
    // Load from localStorage (in production, this would be an API call)
    const roman = this.getLocalLeaderboard('roman');
    const viking = this.getLocalLeaderboard('viking');
    const alien = this.getLocalLeaderboard('alien');
    
    this.leaderboardData = {
      roman: roman,
      viking: viking,
      alien: alien,
    };
    
    this.refreshLeaderboardContent();
  }
  
  getLocalLeaderboard(campaign) {
    const key = `leaderboard_${campaign}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Return empty leaderboard with sample entries
    return [
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
      { player: '---', time: 0, date: '---' },
    ];
  }
  
  refreshLeaderboardContent() {
    // Clear existing entries
    this.entryContainer.removeAll(true);
    
    const data = this.leaderboardData[this.currentTab];
    const { width } = this.scale;
    const startY = this.contentY + 80;
    
    data.slice(0, 10).forEach((entry, index) => {
      const y = startY + index * 45;
      
      // Rank
      const rankColor = index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFFFFF';
      const rank = this.add.text(width / 2 - 350, y, `${index + 1}`, {
        fontSize: '18px',
        fontFamily: 'Press Start 2P',
        color: rankColor,
      });
      rank.setOrigin(0.5);
      this.entryContainer.add(rank);
      
      // Player name
      const player = this.add.text(width / 2 - 150, y, entry.player, {
        fontSize: '16px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
      });
      player.setOrigin(0.5);
      this.entryContainer.add(player);
      
      // Time
      const timeText = entry.time > 0 ? this.formatTime(entry.time) : '---';
      const time = this.add.text(width / 2 + 150, y, timeText, {
        fontSize: '16px',
        fontFamily: 'Press Start 2P',
        color: '#00FF00',
      });
      time.setOrigin(0.5);
      this.entryContainer.add(time);
      
      // Date
      const date = this.add.text(width / 2 + 350, y, entry.date, {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#CCCCCC',
      });
      date.setOrigin(0.5);
      this.entryContainer.add(date);
    });
    
    // Show player's best time if they have one
    this.showPlayerBestTime(width);
  }
  
  showPlayerBestTime(width) {
    // Check if player has a time for this campaign
    const playerTime = this.getPlayerTime(this.currentTab);
    
    if (playerTime) {
      const y = this.contentY + 520;
      
      const bg = this.add.rectangle(width / 2, y, 700, 60, 0x4A3C2F);
      bg.setStrokeStyle(3, 0xFFD700);
      this.entryContainer.add(bg);
      
      const text = this.add.text(width / 2, y, `YOUR BEST: ${this.formatTime(playerTime.time)} - Rank: ${playerTime.rank}`, {
        fontSize: '18px',
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
  
  createBackButton(x, y) {
    const button = this.add.rectangle(x, y, 200, 50, 0x8B4513);
    button.setStrokeStyle(3, 0xFFD700);
    button.setInteractive({ useHandCursor: true });
    
    const text = this.add.text(x, y, 'BACK', {
      fontSize: '20px',
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
    
    console.log(`Added to ${campaign} leaderboard: ${playerName} - ${timeInSeconds}s`);
  }
}
