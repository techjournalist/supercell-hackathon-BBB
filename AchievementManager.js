function safeGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* ignore */ }
}

// Achievement Manager - handles unlocking and notifications
export class AchievementManager {
  constructor(scene) {
    this.scene = scene;
    this.notifications = [];
  }
  
  unlockAchievement(achievementId) {
    // Check if already unlocked
    if (safeGet(`achievement_${achievementId}`) === 'true') {
      return false; // Already unlocked
    }

    // Unlock the achievement
    safeSet(`achievement_${achievementId}`, 'true');
    safeSet(`achievement_date_${achievementId}`, new Date().toISOString());
    
    // Get achievement info
    const achievementData = this.getAchievementData(achievementId);
    
    // Show notification banner
    this.showAchievementBanner(achievementData);
    
    return true;
  }
  
  getAchievementData(achievementId) {
    const achievements = {
      first_blood: { name: 'First Blood', icon: '⚔️' },
      empire_builder: { name: 'Empire Builder', icon: '🏛️' },
      mana_hoarder: { name: 'Mana Hoarder', icon: '💎' },
      flawless: { name: 'Flawless Victory', icon: '🛡️' },
      spell_spammer: { name: 'Spell Spammer', icon: '✨' },
      gold_rush: { name: 'Gold Rush', icon: '💰' },
      speed_demon: { name: 'Speed Demon', icon: '⚡' },
      roman_complete: { name: 'Roman Glory', icon: '🦅' },
      viking_complete: { name: 'Viking Saga', icon: '⚔️' },
      alien_complete: { name: 'Alien Overlord', icon: '👽' },
      all_campaigns: { name: 'All Campaigns', icon: '🏆' },
      centurion_army: { name: 'Centurion Army', icon: '🪖' },
      master_tactician: { name: 'Master Tactician', icon: '🎯' },
      destroyer: { name: 'Destroyer', icon: '💥' },
      wealthy: { name: 'Wealthy', icon: '👑' },
    };
    
    return achievements[achievementId] || { name: 'Unknown', icon: '❓' };
  }
  
  showAchievementBanner(achievementData) {
    const scene = this.scene;
    const { width, height } = scene.scale;
    
    // Banner background
    const banner = scene.add.rectangle(width / 2, -100, 500, 100, 0x1a1a1a, 0.95);
    banner.setStrokeStyle(3, 0xFFD700);
    banner.setScrollFactor(0);
    banner.setDepth(10000);
    
    // Achievement unlocked text
    const unlockedText = scene.add.text(width / 2, -120, 'ACHIEVEMENT UNLOCKED!', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    unlockedText.setOrigin(0.5);
    unlockedText.setScrollFactor(0);
    unlockedText.setDepth(10001);
    
    // Icon
    const icon = scene.add.text(width / 2 - 180, -100, achievementData.icon, {
      fontSize: '48px',
    });
    icon.setOrigin(0.5);
    icon.setScrollFactor(0);
    icon.setDepth(10001);
    
    // Achievement name
    const nameText = scene.add.text(width / 2 - 80, -100, achievementData.name, {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    nameText.setOrigin(0, 0.5);
    nameText.setScrollFactor(0);
    nameText.setDepth(10001);
    
    // Slide in from top
    scene.tweens.add({
      targets: [banner, unlockedText, icon, nameText],
      y: '+=200',
      duration: 500,
      ease: 'Back.easeOut',
    });
    
    // Hold for 3 seconds
    scene.time.delayedCall(3500, () => {
      // Slide out to top
      scene.tweens.add({
        targets: [banner, unlockedText, icon, nameText],
        y: '-=200',
        duration: 400,
        ease: 'Back.easeIn',
        onComplete: () => {
          banner.destroy();
          unlockedText.destroy();
          icon.destroy();
          nameText.destroy();
        }
      });
    });
    
    // Store reference to prevent spam
    this.notifications.push({ banner, unlockedText, icon, nameText });
  }
  
  // Check achievement conditions
  checkAchievement(type, value) {
    switch(type) {
      case 'first_kill':
        this.unlockAchievement('first_blood');
        break;
      case 'units_trained':
        if (value >= 50) this.unlockAchievement('empire_builder');
        break;
      case 'mana_reached':
        if (value >= 200) this.unlockAchievement('mana_hoarder');
        break;
      case 'victory_hp':
        if (value >= 900) this.unlockAchievement('flawless');
        break;
      case 'spells_cast':
        if (value >= 20) this.unlockAchievement('spell_spammer');
        break;
      case 'gold_collected':
        if (value >= 2000) this.unlockAchievement('gold_rush');
        break;
      case 'gold_spent':
        if (value >= 5000) this.unlockAchievement('wealthy');
        break;
      case 'victory_time':
        if (value < 180) this.unlockAchievement('speed_demon');
        break;
      case 'campaign_complete':
        if (value === 'roman') {
          this.unlockAchievement('roman_complete');
          this.checkAllCampaigns();
        } else if (value === 'viking') {
          this.unlockAchievement('viking_complete');
          this.checkAllCampaigns();
        } else if (value === 'alien') {
          this.unlockAchievement('alien_complete');
          this.checkAllCampaigns();
        }
        break;
      case 'centurions':
        if (value >= 10) this.unlockAchievement('centurion_army');
        break;
      case 'perfect_victory':
        this.unlockAchievement('master_tactician');
        break;
      case 'total_kills':
        if (value >= 100) this.unlockAchievement('destroyer');
        break;
    }
  }
  
  checkAllCampaigns() {
    const roman = safeGet('achievement_roman_complete') === 'true';
    const viking = safeGet('achievement_viking_complete') === 'true';
    const alien = safeGet('achievement_alien_complete') === 'true';
    
    if (roman && viking && alien) {
      this.unlockAchievement('all_campaigns');
    }
  }
}
