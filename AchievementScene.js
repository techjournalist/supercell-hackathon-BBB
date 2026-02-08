import Phaser from 'phaser';

export class AchievementScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AchievementScene' });
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Background
    const bg = this.add.rectangle(0, 0, width, height, 0x1a1a1a);
    bg.setOrigin(0);
    
    // Title
    const title = this.add.text(width / 2, 50, 'ACHIEVEMENTS', {
      fontSize: '36px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Achievement definitions
    const achievements = this.getAchievementDefinitions();
    
    // Calculate completion
    const unlockedCount = achievements.filter(a => this.isAchievementUnlocked(a.id)).length;
    
    // Progress bar
    const progressText = this.add.text(width / 2, 100, `${unlockedCount}/${achievements.length} Unlocked`, {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    progressText.setOrigin(0.5);
    
    // Scrollable achievement grid
    const startY = 140;
    const columns = 3;
    const cardWidth = 250;
    const cardHeight = 180;
    const spacing = 20;
    
    achievements.forEach((achievement, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = (width / 2) - (columns * (cardWidth + spacing) / 2) + col * (cardWidth + spacing) + cardWidth / 2;
      const y = startY + row * (cardHeight + spacing);
      
      const unlocked = this.isAchievementUnlocked(achievement.id);
      
      // Card
      const card = this.add.rectangle(x, y, cardWidth, cardHeight, unlocked ? 0x2a2a2a : 0x1a1a1a);
      card.setStrokeStyle(2, unlocked ? 0xFFD700 : 0x444444);
      
      // Icon
      const icon = this.add.text(x, y - 50, achievement.icon, {
        fontSize: unlocked ? '48px' : '36px',
        color: unlocked ? '#FFFFFF' : '#333333',
      });
      icon.setOrigin(0.5);
      icon.setAlpha(unlocked ? 1 : 0.3);
      
      // Name
      const name = this.add.text(x, y + 10, achievement.name, {
        fontSize: '14px',
        fontFamily: 'Press Start 2P',
        color: unlocked ? '#FFD700' : '#555555',
        align: 'center',
        wordWrap: { width: cardWidth - 20 }
      });
      name.setOrigin(0.5);
      
      // Description
      const desc = this.add.text(x, y + 45, achievement.desc, {
        fontSize: '10px',
        fontFamily: 'Press Start 2P',
        color: unlocked ? '#AAAAAA' : '#444444',
        align: 'center',
        wordWrap: { width: cardWidth - 20 }
      });
      desc.setOrigin(0.5);
      
      // Unlock date if unlocked
      if (unlocked) {
        const unlockDate = localStorage.getItem(`achievement_date_${achievement.id}`);
        if (unlockDate) {
          const date = new Date(unlockDate);
          const dateText = this.add.text(x, y + 75, date.toLocaleDateString(), {
            fontSize: '8px',
            fontFamily: 'Press Start 2P',
            color: '#666666',
          });
          dateText.setOrigin(0.5);
        }
      }
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
  
  getAchievementDefinitions() {
    return [
      { id: 'first_blood', name: 'First Blood', desc: 'Kill your first enemy unit', icon: '⚔️' },
      { id: 'empire_builder', name: 'Empire Builder', desc: 'Train 50 units in one match', icon: '🏛️' },
      { id: 'mana_hoarder', name: 'Mana Hoarder', desc: 'Reach 200 mana', icon: '💎' },
      { id: 'flawless', name: 'Flawless Victory', desc: 'Win with base above 900 HP', icon: '🛡️' },
      { id: 'spell_spammer', name: 'Spell Spammer', desc: 'Cast 20 spells in one match', icon: '✨' },
      { id: 'gold_rush', name: 'Gold Rush', desc: 'Collect 2000 gold in one match', icon: '💰' },
      { id: 'speed_demon', name: 'Speed Demon', desc: 'Win a match in under 3 minutes', icon: '⚡' },
      { id: 'roman_complete', name: 'Roman Glory', desc: 'Complete Roman campaign', icon: '🦅' },
      { id: 'viking_complete', name: 'Viking Saga', desc: 'Complete Viking campaign', icon: '⚔️' },
      { id: 'alien_complete', name: 'Alien Overlord', desc: 'Complete Alien campaign', icon: '👽' },
      { id: 'all_campaigns', name: 'All Campaigns', desc: 'Complete all 3 campaigns', icon: '🏆' },
      { id: 'centurion_army', name: 'Centurion Army', desc: 'Have 10 Centurions at once', icon: '🪖' },
      { id: 'master_tactician', name: 'Master Tactician', desc: 'Win without losing a unit', icon: '🎯' },
      { id: 'destroyer', name: 'Destroyer', desc: 'Destroy 100 enemy units (total)', icon: '💥' },
      { id: 'wealthy', name: 'Wealthy', desc: 'Spend 5000 gold total in one match', icon: '👑' },
    ];
  }
  
  isAchievementUnlocked(achievementId) {
    return localStorage.getItem(`achievement_${achievementId}`) === 'true';
  }
}
