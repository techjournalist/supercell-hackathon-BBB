import Phaser from 'phaser';

export class ChallengeMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ChallengeMenuScene' });
  }
  
  preload() {
    // Load challenge mode background
    this.load.image('challenge-bg', 'https://rosebud.ai/assets/challenge-mode.jpeg?kiyU');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Background image
    const bg = this.add.image(width / 2, 0, 'challenge-bg');
    bg.setOrigin(0.5, 0);
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Dark overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);
    
    // Title
    const title = this.add.text(width / 2, 60, 'CHALLENGE MODE', {
      fontSize: '42px',
      fontFamily: 'Press Start 2P',
      color: '#FF6B00',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Subtitle
    const subtitle = this.add.text(width / 2, 120, 'Test your skills!', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    subtitle.setOrigin(0.5);
    
    // Challenge cards
    const startY = 200;
    const cardSpacing = 140;
    
    const challenges = [
      {
        id: 'endless',
        name: 'Endless Waves',
        desc: 'Survive infinite escalating waves',
        icon: '♾️',
        color: 0xFF4444,
      },
      {
        id: 'goldrush',
        name: 'Gold Rush',
        desc: 'Collect 2000 gold as fast as possible',
        icon: '💰',
        color: 0xFFD700,
      },
      {
        id: 'spellmaster',
        name: 'Spell Master',
        desc: 'Win using only spells, no combat units',
        icon: '✨',
        color: 0x00CED1,
      },
      {
        id: 'speedblitz',
        name: 'Speed Blitz',
        desc: 'Destroy enemy base under 3 minutes',
        icon: '⚡',
        color: 0xFF00FF,
      },
    ];
    
    challenges.forEach((challenge, index) => {
      const y = startY + index * cardSpacing;
      
      // Card background
      const card = this.add.rectangle(width / 2, y, 700, 120, 0x1a1a2e);
      card.setStrokeStyle(3, challenge.color);
      card.setInteractive({ useHandCursor: true });
      
      // Icon
      const icon = this.add.text(width / 2 - 300, y, challenge.icon, {
        fontSize: '64px',
      });
      icon.setOrigin(0.5);
      
      // Name
      const name = this.add.text(width / 2 - 200, y - 25, challenge.name, {
        fontSize: '22px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
      });
      name.setOrigin(0, 0.5);
      
      // Description
      const desc = this.add.text(width / 2 - 200, y + 10, challenge.desc, {
        fontSize: '14px',
        fontFamily: 'Press Start 2P',
        color: '#AAAAAA',
      });
      desc.setOrigin(0, 0.5);
      
      // High score display
      const highScore = this.getChallengeHighScore(challenge.id);
      let scoreText = '';
      if (challenge.id === 'endless') {
        scoreText = highScore > 0 ? `Best: ${Math.floor(highScore)}s` : 'Not attempted';
      } else if (challenge.id === 'goldrush') {
        scoreText = highScore > 0 ? `Best: ${Math.floor(highScore)}s` : 'Not attempted';
      } else if (challenge.id === 'speedblitz') {
        const bestStars = parseInt(localStorage.getItem('challenge_speedblitz_stars') || '0');
        let starDisplay = '';
        if (bestStars > 0) {
          starDisplay = ' '.repeat(bestStars).replace(/ /g, '★');
        }
        scoreText = highScore > 0 ? `Best: ${Math.floor(highScore)}s ${starDisplay}` : 'Not attempted';
      } else {
        scoreText = highScore > 0 ? 'Completed!' : 'Not attempted';
      }
      
      const score = this.add.text(width / 2 + 280, y, scoreText, {
        fontSize: '12px',
        fontFamily: 'Press Start 2P',
        color: highScore > 0 ? '#00FF00' : '#666666',
      });
      score.setOrigin(1, 0.5);
      
      // Interaction
      card.on('pointerover', () => {
        card.setFillStyle(0x2a2a3e);
        this.tweens.add({
          targets: card,
          scaleX: 1.02,
          scaleY: 1.02,
          duration: 100,
        });
      });
      
      card.on('pointerout', () => {
        card.setFillStyle(0x1a1a2e);
        this.tweens.add({
          targets: card,
          scaleX: 1,
          scaleY: 1,
          duration: 100,
        });
      });
      
      card.on('pointerdown', () => {
        this.startChallenge(challenge.id);
      });
    });
    
    // Back button
    const backButton = this.add.rectangle(80, height - 60, 140, 50, 0x8B4513);
    backButton.setStrokeStyle(2, 0xFFD700);
    backButton.setInteractive({ useHandCursor: true });
    
    const backText = this.add.text(80, height - 60, 'BACK', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    backText.setOrigin(0.5);
    
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xA0522D);
    });
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x8B4513);
    });
    
    backButton.on('pointerdown', () => {
      this.scene.start('MenuScene');
    });
  }
  
  getChallengeHighScore(challengeId) {
    return parseFloat(localStorage.getItem(`challenge_${challengeId}`) || '0');
  }
  
  startChallenge(challengeId) {
    // Set challenge mode in registry
    this.registry.set('challengeMode', challengeId);
    this.registry.set('campaignLevel', null);
    this.registry.set('vikingCampaign', false);
    this.registry.set('alienCampaign', false);
    
    // Default to Roman faction for challenges
    this.registry.set('playerFaction', 'roman');
    
    this.scene.start('GameScene');
  }
}
