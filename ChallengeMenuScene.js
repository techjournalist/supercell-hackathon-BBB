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

    // Responsive font size helper: clamp between min and max, scaling by a factor of width
    const rf = (min, factor, max) => Math.max(min, Math.min(Math.round(width * factor), max));

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

    // Responsive font sizes
    const titleFontSize = rf(18, 0.04, 42);
    const subtitleFontSize = rf(9, 0.016, 16);
    const iconFontSize = rf(20, 0.05, 64);
    const nameFontSize = rf(10, 0.022, 22);
    const descFontSize = rf(7, 0.014, 14);
    const scoreFontSize = rf(7, 0.012, 12);
    const backFontSize = rf(9, 0.016, 16);

    // Responsive Y positions for title area
    const titleY = height * 0.1;
    const subtitleY = height * 0.2;

    // Title
    const title = this.add.text(width / 2, titleY, 'CHALLENGE MODE', {
      fontSize: `${titleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#FF6B00',
      stroke: '#000000',
      strokeThickness: Math.max(2, Math.round(titleFontSize * 0.14)),
    });
    title.setOrigin(0.5);

    // Subtitle
    const subtitle = this.add.text(width / 2, subtitleY, 'Test your skills!', {
      fontSize: `${subtitleFontSize}px`,
      fontFamily: 'Press Start 2P',
      color: '#AAAAAA',
    });
    subtitle.setOrigin(0.5);

    // Responsive card layout: fit 4 cards between title area and bottom margin
    const numCards = 4;
    const topArea = height * 0.27;              // where cards start
    const bottomMargin = height * 0.12;         // space for back button
    const availableHeight = height - topArea - bottomMargin;
    const cardGap = Math.max(4, availableHeight * 0.06);
    const cardSpacing = availableHeight / numCards;
    const cardHeight = Math.min(120, cardSpacing - cardGap);
    const cardWidth = Math.min(700, width * 0.85);
    const startY = topArea + cardSpacing / 2;   // center first card in its slot

    // Column offsets as proportions of card width
    const iconOffsetX = -cardWidth * 0.43;
    const nameOffsetX = -cardWidth * 0.29;
    const scoreOffsetX = cardWidth * 0.4;

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
      const card = this.add.rectangle(width / 2, y, cardWidth, cardHeight, 0x1a1a2e);
      card.setStrokeStyle(Math.max(1, Math.round(cardHeight * 0.025)), challenge.color);
      card.setInteractive({ useHandCursor: true });

      // Icon
      const icon = this.add.text(width / 2 + iconOffsetX, y, challenge.icon, {
        fontSize: `${iconFontSize}px`,
      });
      icon.setOrigin(0.5);

      // Name (offset upward proportional to card height)
      const name = this.add.text(width / 2 + nameOffsetX, y - cardHeight * 0.21, challenge.name, {
        fontSize: `${nameFontSize}px`,
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
      });
      name.setOrigin(0, 0.5);

      // Description
      const desc = this.add.text(width / 2 + nameOffsetX, y + cardHeight * 0.1, challenge.desc, {
        fontSize: `${descFontSize}px`,
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

      const score = this.add.text(width / 2 + scoreOffsetX, y, scoreText, {
        fontSize: `${scoreFontSize}px`,
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

    // Responsive back button
    const backBtnWidth = Math.min(140, width * 0.15);
    const backBtnHeight = Math.min(50, height * 0.1);
    const backBtnX = width * 0.08;
    const backBtnY = height - height * 0.08;

    const backButton = this.add.rectangle(backBtnX, backBtnY, backBtnWidth, backBtnHeight, 0x8B4513);
    backButton.setStrokeStyle(2, 0xFFD700);
    backButton.setInteractive({ useHandCursor: true });

    const backText = this.add.text(backBtnX, backBtnY, 'BACK', {
      fontSize: `${backFontSize}px`,
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
