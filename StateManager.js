// Centralized State Manager - handles cross-scene state
export class StateManager {
  constructor() {
    this.state = {
      // Campaign progress
      campaignLevel: null,
      vikingCampaign: false,
      alienCampaign: false,
      alienLevel: null,
      
      // Skirmish settings
      skirmishDifficulty: null,
      
      // Challenge mode
      challengeMode: null,
      
      // Multiplayer
      multiplayerSettings: null,
      
      // Player faction
      playerFaction: 'roman',
      enemyFaction: 'alien',
      
      // Persistent data (synced with localStorage)
      totalKills: parseInt(localStorage.getItem('total_kills') || '0'),
      achievements: JSON.parse(localStorage.getItem('achievements') || '{}'),
      campaignProgress: JSON.parse(localStorage.getItem('campaign_progress') || '{"roman": 0, "viking": 0, "alien": 0}'),
    };
  }
  
  // Get state value
  get(key) {
    return this.state[key];
  }
  
  // Set state value
  set(key, value) {
    this.state[key] = value;
  }
  
  // Reset temporary state (between games)
  resetGameState() {
    this.state.campaignLevel = null;
    this.state.vikingCampaign = false;
    this.state.alienCampaign = false;
    this.state.alienLevel = null;
    this.state.skirmishDifficulty = null;
    this.state.challengeMode = null;
  }
  
  // Persist data to localStorage
  savePersistentData() {
    localStorage.setItem('total_kills', this.state.totalKills.toString());
    localStorage.setItem('achievements', JSON.stringify(this.state.achievements));
    localStorage.setItem('campaign_progress', JSON.stringify(this.state.campaignProgress));
  }
  
  // Update total kills and save
  addKills(count) {
    this.state.totalKills += count;
    this.savePersistentData();
  }
  
  // Unlock achievement
  unlockAchievement(achievementId) {
    if (!this.state.achievements[achievementId]) {
      this.state.achievements[achievementId] = {
        unlocked: true,
        timestamp: Date.now(),
      };
      this.savePersistentData();
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  }
  
  // Update campaign progress
  updateCampaignProgress(faction, level) {
    if (level > this.state.campaignProgress[faction]) {
      this.state.campaignProgress[faction] = level;
      this.savePersistentData();
    }
  }
}

// Global singleton instance
export const stateManager = new StateManager();
