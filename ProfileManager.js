const MAX_PROFILES = 3;
const STORAGE_KEY = 'bbb_profiles';
const ACTIVE_KEY = 'bbb_active_profile';

const ICONS = ['sword', 'shield', 'skull'];
const ICON_CHARS = { sword: '⚔', shield: '🛡', skull: '💀' };

let _profilesCache = null;

function defaultProfile(slot) {
  return {
    slot,
    name: `Commander ${slot + 1}`,
    icon: ICONS[slot] || 'sword',
    sessionId: crypto.randomUUID(),
    createdAt: Date.now(),
    lastPlayed: Date.now(),
    totalGames: 0,
    totalWins: 0,
    favoriteFacton: null,
  };
}

function loadProfiles() {
  if (_profilesCache !== null) return _profilesCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    _profilesCache = raw ? JSON.parse(raw) : [];
    return _profilesCache;
  } catch {
    _profilesCache = [];
    return _profilesCache;
  }
}

function saveProfiles(profiles) {
  _profilesCache = profiles;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {}
}

export const ProfileManager = {
  getAll() {
    return loadProfiles();
  },

  getActive() {
    const profiles = loadProfiles();
    const activeSlot = parseInt(localStorage.getItem(ACTIVE_KEY) ?? '-1', 10);
    return profiles.find(p => p.slot === activeSlot) || null;
  },

  setActive(slot) {
    const profiles = loadProfiles();
    const profile = profiles.find(p => p.slot === slot);
    if (!profile) return false;
    profile.lastPlayed = Date.now();
    saveProfiles(profiles);
    localStorage.setItem(ACTIVE_KEY, String(slot));
    return true;
  },

  create(name, icon) {
    const profiles = loadProfiles();
    if (profiles.length >= MAX_PROFILES) return null;

    const usedSlots = new Set(profiles.map(p => p.slot));
    let slot = 0;
    while (usedSlots.has(slot)) slot++;
    if (slot >= MAX_PROFILES) return null;

    const profile = defaultProfile(slot);
    profile.name = name.trim().substring(0, 12) || `Commander ${slot + 1}`;
    profile.icon = icon || ICONS[slot] || 'sword';

    profiles.push(profile);
    saveProfiles(profiles);
    localStorage.setItem(ACTIVE_KEY, String(slot));
    return profile;
  },

  rename(slot, newName) {
    const profiles = loadProfiles();
    const profile = profiles.find(p => p.slot === slot);
    if (!profile) return false;
    profile.name = newName.trim().substring(0, 12) || profile.name;
    saveProfiles(profiles);
    return true;
  },

  delete(slot) {
    let profiles = loadProfiles();
    profiles = profiles.filter(p => p.slot !== slot);
    saveProfiles(profiles);
    const active = parseInt(localStorage.getItem(ACTIVE_KEY) ?? '-1', 10);
    if (active === slot) {
      localStorage.removeItem(ACTIVE_KEY);
    }
    this._cleanProfileLocalStorage(slot);
  },

  updateStats(slot, won) {
    const profiles = loadProfiles();
    const profile = profiles.find(p => p.slot === slot);
    if (!profile) return;
    profile.totalGames = (profile.totalGames || 0) + 1;
    profile.totalWins = (profile.totalWins || 0) + (won ? 1 : 0);
    profile.lastPlayed = Date.now();
    saveProfiles(profiles);
  },

  getIconChar(icon) {
    return ICON_CHARS[icon] || '⚔';
  },

  hasAnyProfile() {
    return loadProfiles().length > 0;
  },

  getNamespacedKey(slot, key) {
    return `profile_${slot}_${key}`;
  },

  migrateExistingSession() {
    const existing = localStorage.getItem('gameSessionId');
    const profiles = loadProfiles();
    if (existing && profiles.length === 0) {
      const profile = defaultProfile(0);
      profile.name = localStorage.getItem('playerName') || 'Commander 1';
      profile.sessionId = existing;
      profiles.push(profile);
      saveProfiles(profiles);
      localStorage.setItem(ACTIVE_KEY, '0');
      return profile;
    }
    return null;
  },

  _cleanProfileLocalStorage(slot) {
    const keys = [
      'campaign_progress', 'total_kills', 'achievements',
      'leaderboard_roman', 'leaderboard_viking', 'leaderboard_alien',
      'player_time_roman', 'player_time_viking', 'player_time_alien',
      'challenge_goldrush', 'challenge_speedblitz', 'challenge_speedblitz_stars',
    ];
    keys.forEach(k => {
      try { localStorage.removeItem(`profile_${slot}_${k}`); } catch {}
    });
  },
};
