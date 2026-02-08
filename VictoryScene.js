import Phaser from 'phaser';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VictoryScene' });
  }
  
  preload() {
    // Load victory background
    this.load.image('victory-bg', 'https://rosebud.ai/assets/victory-screen.jpeg?P3a2');
  }
  
  create(data) {
    const { width, height } = this.scale;
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Check if challenge mode
    const challengeMode = data.challengeMode;
    const challengeScore = data.challengeScore;
    
    // Victory background image
    const bg = this.add.image(width / 2, height / 2, 'victory-bg');
    bg.setDisplaySize(width, height);
    
    // Add semi-transparent overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.3);
    overlay.setOrigin(0);
    
    // Add golden sparkle particles
    this.createVictoryParticles(width, height);
    
    // Victory banner (semi-transparent to show background)
    const banner = this.add.rectangle(width / 2, 150, width * 0.9, 150, 0x4CAF50, 0.7);
    banner.setStrokeStyle(5, 0xFFD700);
    
    // Add banner glow
    this.tweens.add({
      targets: banner,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    const victoryText = this.add.text(width / 2, 150, 'VICTORY!', {
      fontSize: '72px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 8,
    });
    victoryText.setOrigin(0.5);
    
    // Animate victory text with more dynamic effect
    this.tweens.add({
      targets: victoryText,
      scale: 1.1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Add celebratory icons
    const leftIcon = this.add.text(width / 2 - 300, 150, '🏆', { fontSize: '80px' });
    leftIcon.setOrigin(0.5);
    const rightIcon = this.add.text(width / 2 + 300, 150, '🏆', { fontSize: '80px' });
    rightIcon.setOrigin(0.5);
    
    this.tweens.add({
      targets: [leftIcon, rightIcon],
      angle: 360,
      duration: 3000,
      repeat: -1,
      ease: 'Linear'
    });
    
    // Stats panel
    const statsY = 300;
    const stats = data.stats || {
      unitsTrained: 0,
      goldEarned: 0,
      timeElapsed: 0,
      spellsCast: 0
    };
    
    const statsPanel = this.add.rectangle(width / 2, statsY + 120, 500, 300, 0x2C2416, 0.85);
    statsPanel.setStrokeStyle(4, 0xFFD700);
    
    const statsTitle = this.add.text(width / 2, statsY, challengeMode ? 'CHALLENGE COMPLETE!' : 'BATTLE STATISTICS', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    statsTitle.setOrigin(0.5);
    
    // Challenge mode special stats
    let statsText = [];
    if (challengeMode === 'goldrush') {
      const minutes = Math.floor(challengeScore / 60);
      const seconds = challengeScore % 60;
      const bestScore = localStorage.getItem('challenge_goldrush');
      statsText = [
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`,
        `Best: ${bestScore ? this.formatTime(parseFloat(bestScore) * 1000) : 'N/A'}`,
        '',
        'Gold Rush Complete!'
      ];
    } else if (challengeMode === 'speedblitz') {
      const minutes = Math.floor(challengeScore / 60);
      const seconds = challengeScore % 60;
      const bestScore = localStorage.getItem('challenge_speedblitz');
      const bestStars = parseInt(localStorage.getItem('challenge_speedblitz_stars') || '0');
      
      // Calculate star rating based on completion time
      const stars = this.calculateSpeedBlitzStars(challengeScore);
      
      let bestStarText = '';
      if (bestStars > 0) {
        bestStarText = ' '.repeat(bestStars).replace(/ /g, '★');
      }
      
      statsText = [
        `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`,
        `Best: ${bestScore ? this.formatTime(parseFloat(bestScore) * 1000) : 'N/A'} ${bestStarText}`,
        '',
        this.getSpeedBlitzRating(stars)
      ];
      
      // Display star rating with animation
      this.displayStarRating(width / 2, statsY + 250, stars, bestStars);
    } else if (challengeMode === 'spellmaster') {
      statsText = [
        'Spell Master Complete!',
        '',
        `Spells Cast: ${stats.spellsCast}`,
        'No Combat Units Used!'
      ];
    } else {
      // Regular game stats
      statsText = [
        `Units Trained: ${stats.unitsTrained}`,
        `Gold Earned: ${stats.goldEarned}`,
        `Time: ${this.formatTime(stats.timeElapsed)}`,
        `Spells Cast: ${stats.spellsCast}`
      ];
    }
    
    let statY = statsY + 60;
    statsText.forEach(stat => {
      const text = this.add.text(width / 2, statY, stat, {
        fontSize: '18px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
      });
      text.setOrigin(0.5);
      statY += 50;
    });
    
    // Buttons
    const buttonY = height - 150;
    
    // Check if in campaign mode
    const campaignLevel = this.registry.get('campaignLevel');
    const vikingCampaign = this.registry.get('vikingCampaign');
    const alienCampaign = this.registry.get('alienCampaign');
    const skirmishDifficulty = this.registry.get('skirmishDifficulty');
    
    if (challengeMode) {
      // Challenge mode - show Try Again and Challenge Menu
      this.createButton(width / 2 - 150, buttonY, 250, 60, 'TRY AGAIN', () => {
        this.registry.set('challengeMode', challengeMode);
        this.startTransition('GameScene');
      });
      
      this.createButton(width / 2 + 150, buttonY, 300, 60, 'CHALLENGE MENU', () => {
        this.registry.set('challengeMode', null);
        this.startTransition('ChallengeMenuScene');
      });
    } else if (campaignLevel || vikingCampaign || alienCampaign) {
      // Campaign mode - show Continue Campaign button
      let campaignScene = 'CampaignScene';
      if (vikingCampaign) campaignScene = 'VikingCampaignScene';
      if (alienCampaign) campaignScene = 'AlienCampaignScene';
      
      this.createButton(width / 2 - 150, buttonY, 300, 60, 'CONTINUE CAMPAIGN', () => {
        this.startTransition(campaignScene);
      });
      
      // Main Menu button
      this.createButton(width / 2 + 180, buttonY, 250, 60, 'MAIN MENU', () => {
        this.registry.set('campaignLevel', null); // Clear campaign mode
        this.registry.set('vikingCampaign', false);
        this.registry.set('alienCampaign', false);
        this.startTransition('MenuScene');
      });
    } else if (skirmishDifficulty) {
      // Skirmish mode - show Rematch and Main Menu
      this.createButton(width / 2 - 150, buttonY, 250, 60, 'REMATCH', () => {
        this.startTransition('SkirmishSetupScene');
      });
      
      // Main Menu button
      this.createButton(width / 2 + 150, buttonY, 250, 60, 'MAIN MENU', () => {
        this.registry.set('skirmishDifficulty', null); // Clear skirmish mode
        this.startTransition('MenuScene');
      });
    } else {
      // Legacy mode - show Next Level button
      this.createButton(width / 2 - 150, buttonY, 250, 60, 'NEXT LEVEL', () => {
        this.startTransition('FactionSelectScene');
      });
      
      // Main Menu button
      this.createButton(width / 2 + 150, buttonY, 250, 60, 'MAIN MENU', () => {
        this.startTransition('MenuScene');
      });
    }
  }
  
  createButton(x, y, width, height, text, callback) {
    const button = this.add.rectangle(x, y, width, height, 0x8B4513);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(4, 0xFFD700);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '20px',
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
  
  createVictoryParticles(width, height) {
    // Create golden sparkles continuously
    this.time.addEvent({
      delay: 200,
      callback: () => {
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * width;
          const y = height;
          const sparkle = this.add.circle(x, y, 3, 0xFFD700);
          
          this.tweens.add({
            targets: sparkle,
            y: Math.random() * height * 0.5,
            x: x + (Math.random() - 0.5) * 100,
            alpha: 0,
            scale: 0,
            duration: 2000 + Math.random() * 1000,
            ease: 'Power2',
            onComplete: () => sparkle.destroy()
          });
        }
      },
      loop: true
    });
  }
  
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
  
  calculateSpeedBlitzStars(completionTime) {
    // Star thresholds (in seconds):
    // 3 stars: Under 90 seconds (1:30)
    // 2 stars: Under 120 seconds (2:00)
    // 1 star: Under 180 seconds (3:00) - the time limit
    
    if (completionTime <= 90) {
      return 3;
    } else if (completionTime <= 120) {
      return 2;
    } else {
      return 1;
    }
  }
  
  getSpeedBlitzRating(stars) {
    switch(stars) {
      case 3:
        return 'LIGHTNING FAST!';
      case 2:
        return 'SPEEDY VICTORY!';
      case 1:
        return 'MISSION COMPLETE!';
      default:
        return 'VICTORY!';
    }
  }
  
  displayStarRating(centerX, centerY, stars, bestStars = 0) {
    const starSpacing = 80;
    const startX = centerX - ((stars - 1) * starSpacing / 2);
    
    // Create rating label
    const ratingLabel = this.add.text(centerX, centerY - 60, 'PERFORMANCE RATING', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 3
    });
    ratingLabel.setOrigin(0.5);
    ratingLabel.setAlpha(0);
    
    this.tweens.add({
      targets: ratingLabel,
      alpha: 1,
      duration: 500,
      delay: 200
    });
    
    // Show "NEW BEST!" if player improved their star rating
    if (stars > bestStars) {
      const newBestLabel = this.add.text(centerX, centerY - 90, '✨ NEW BEST! ✨', {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#00FF00',
        stroke: '#000000',
        strokeThickness: 4
      });
      newBestLabel.setOrigin(0.5);
      newBestLabel.setAlpha(0);
      
      this.tweens.add({
        targets: newBestLabel,
        alpha: 1,
        scale: 1.1,
        duration: 400,
        delay: 100,
        ease: 'Back.easeOut'
      });
      
      this.tweens.add({
        targets: newBestLabel,
        scale: 1.15,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    // Display stars with staggered animation
    for (let i = 0; i < 3; i++) {
      const starX = startX + (i * starSpacing);
      const isEarned = i < stars;
      
      // Background star (dark/unearned)
      const bgStar = this.add.text(starX, centerY, '★', {
        fontSize: '72px',
        color: isEarned ? '#FFD700' : '#444444',
        stroke: '#000000',
        strokeThickness: 4
      });
      bgStar.setOrigin(0.5);
      bgStar.setScale(0);
      bgStar.setAlpha(0);
      
      // Animate star appearance
      this.tweens.add({
        targets: bgStar,
        scale: 1,
        alpha: 1,
        duration: 300,
        delay: 400 + (i * 200),
        ease: 'Back.easeOut'
      });
      
      // Extra effects for earned stars
      if (isEarned) {
        // Glow effect
        const glow = this.add.circle(starX, centerY, 40, 0xFFD700, 0.3);
        glow.setScale(0);
        
        this.tweens.add({
          targets: glow,
          scale: 1.5,
          alpha: 0,
          duration: 600,
          delay: 400 + (i * 200),
          ease: 'Power2'
        });
        
        // Pulsing animation
        this.tweens.add({
          targets: bgStar,
          scale: 1.15,
          duration: 800,
          delay: 700 + (i * 200),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
        
        // Sparkle particles for earned stars
        this.time.delayedCall(400 + (i * 200), () => {
          this.createStarSparkles(starX, centerY);
        });
      }
    }
    
    // Add time thresholds guide below stars
    const thresholdText = this.add.text(centerX, centerY + 70, 
      '★★★ < 1:30  |  ★★ < 2:00  |  ★ < 3:00', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#888888',
      stroke: '#000000',
      strokeThickness: 2
    });
    thresholdText.setOrigin(0.5);
    thresholdText.setAlpha(0);
    
    this.tweens.add({
      targets: thresholdText,
      alpha: 1,
      duration: 500,
      delay: 1200
    });
  }
  
  createStarSparkles(x, y) {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const distance = 50 + Math.random() * 30;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance;
      
      const sparkle = this.add.circle(x, y, 3, 0xFFD700);
      
      this.tweens.add({
        targets: sparkle,
        x: targetX,
        y: targetY,
        alpha: 0,
        scale: 0,
        duration: 500 + Math.random() * 300,
        ease: 'Power2',
        onComplete: () => sparkle.destroy()
      });
    }
  }
  
  startTransition(nextScene) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(nextScene);
    });
  }
}
