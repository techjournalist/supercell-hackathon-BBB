import { ProfileManager } from './ProfileManager.js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createClient = window.supabase?.createClient;
export const supabase = createClient ? createClient(supabaseUrl, supabaseAnonKey) : null;

function getSessionId() {
  const profile = ProfileManager.getActive();
  if (profile) return profile.sessionId;
  let id = localStorage.getItem('gameSessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('gameSessionId', id);
  }
  return id;
}

export const sessionId = getSessionId();

export async function saveGameSession(data) {
  try {
    const { error } = await supabase.from('game_sessions').insert({
      session_id: sessionId,
      faction: data.faction || 'roman',
      game_mode: data.gameMode || 'skirmish',
      campaign_level: data.campaignLevel || null,
      difficulty: data.difficulty || 'normal',
      result: data.result || 'defeat',
      time_seconds: Math.floor(data.timeSeconds || 0),
      units_trained: data.unitsTrained || 0,
      enemies_killed: data.enemiesKilled || 0,
      units_lost: data.unitsLost || 0,
      gold_earned: data.goldEarned || 0,
      spells_cast: data.spellsCast || 0,
    });
    if (error) console.warn('saveGameSession error:', error.message);
  } catch (e) {
    console.warn('saveGameSession failed:', e);
  }
}

export async function saveCampaignProgress(romanLevel, vikingLevel, alienLevel, bestTimes = {}) {
  try {
    const { data: existing } = await supabase
      .from('campaign_progress')
      .select('id, roman_level, viking_level, alien_level')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('campaign_progress')
        .update({
          roman_level: Math.max(existing.roman_level, romanLevel),
          viking_level: Math.max(existing.viking_level, vikingLevel),
          alien_level: Math.max(existing.alien_level, alienLevel),
          roman_best_times: bestTimes.roman || {},
          viking_best_times: bestTimes.viking || {},
          alien_best_times: bestTimes.alien || {},
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
      if (error) console.warn('saveCampaignProgress update error:', error.message);
    } else {
      const { error } = await supabase.from('campaign_progress').insert({
        session_id: sessionId,
        roman_level: romanLevel,
        viking_level: vikingLevel,
        alien_level: alienLevel,
        roman_best_times: bestTimes.roman || {},
        viking_best_times: bestTimes.viking || {},
        alien_best_times: bestTimes.alien || {},
      });
      if (error) console.warn('saveCampaignProgress insert error:', error.message);
    }
  } catch (e) {
    console.warn('saveCampaignProgress failed:', e);
  }
}

export async function getCampaignProgress() {
  try {
    const { data, error } = await supabase
      .from('campaign_progress')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();
    if (error) console.warn('getCampaignProgress error:', error.message);
    return data;
  } catch (e) {
    console.warn('getCampaignProgress failed:', e);
    return null;
  }
}

export async function submitLeaderboardEntry(gameMode, faction, score, timeSeconds, enemiesKilled) {
  try {
    const { error } = await supabase.from('leaderboard').insert({
      session_id: sessionId,
      display_name: 'Commander',
      game_mode: gameMode,
      faction,
      score,
      time_seconds: Math.floor(timeSeconds),
      enemies_killed: enemiesKilled,
    });
    if (error) console.warn('submitLeaderboardEntry error:', error.message);
  } catch (e) {
    console.warn('submitLeaderboardEntry failed:', e);
  }
}

export async function getLeaderboard(gameMode = null, limit = 20) {
  try {
    let query = supabase
      .from('leaderboard')
      .select('display_name, faction, game_mode, score, enemies_killed, time_seconds, created_at')
      .order('score', { ascending: false })
      .limit(limit);

    if (gameMode) {
      query = query.eq('game_mode', gameMode);
    }

    const { data, error } = await query;
    if (error) console.warn('getLeaderboard error:', error.message);
    return data || [];
  } catch (e) {
    console.warn('getLeaderboard failed:', e);
    return [];
  }
}

export async function saveLevelStars(campaignType, levelNum, difficulty, starsEarned) {
  try {
    const localKey = `levelStars`;
    const starMap = JSON.parse(localStorage.getItem(localKey) || '{}');
    const mapKey = `${campaignType}_${levelNum}_${difficulty}`;
    const existing = starMap[mapKey] || 0;
    const newStars = Math.max(existing, starsEarned);
    starMap[mapKey] = newStars;
    localStorage.setItem(localKey, JSON.stringify(starMap));

    const { data: existingRow } = await supabase
      .from('campaign_level_stars')
      .select('id, stars_earned')
      .eq('session_id', sessionId)
      .eq('campaign_type', campaignType)
      .eq('level_num', levelNum)
      .eq('difficulty', difficulty)
      .maybeSingle();

    if (existingRow) {
      if (starsEarned > existingRow.stars_earned) {
        const { error } = await supabase
          .from('campaign_level_stars')
          .update({ stars_earned: starsEarned, completed_at: new Date().toISOString() })
          .eq('id', existingRow.id);
        if (error) console.warn('saveLevelStars update error:', error.message);
      }
    } else {
      const { error } = await supabase.from('campaign_level_stars').insert({
        session_id: sessionId,
        campaign_type: campaignType,
        level_num: levelNum,
        difficulty,
        stars_earned: starsEarned,
      });
      if (error) console.warn('saveLevelStars insert error:', error.message);
    }
  } catch (e) {
    console.warn('saveLevelStars failed:', e);
  }
}

export async function getAllLevelStars() {
  try {
    const { data, error } = await supabase
      .from('campaign_level_stars')
      .select('campaign_type, level_num, difficulty, stars_earned')
      .eq('session_id', sessionId);
    if (error) console.warn('getAllLevelStars error:', error.message);

    const starMap = {};
    (data || []).forEach(row => {
      const key = `${row.campaign_type}_${row.level_num}_${row.difficulty}`;
      starMap[key] = row.stars_earned;
    });

    localStorage.setItem('levelStars', JSON.stringify(starMap));
    return starMap;
  } catch (e) {
    console.warn('getAllLevelStars failed:', e);
    return JSON.parse(localStorage.getItem('levelStars') || '{}');
  }
}

export async function updatePlayerStats(won, faction, timeSeconds, kills) {
  try {
    const factionWinKey = `${faction}_wins`;
    const { data: existing } = await supabase
      .from('player_stats')
      .select('total_games, total_wins, total_kills, total_playtime_seconds, roman_wins, viking_wins, alien_wins')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (existing) {
      const romanWins = (existing.roman_wins || 0) + (faction === 'roman' && won ? 1 : 0);
      const vikingWins = (existing.viking_wins || 0) + (faction === 'viking' && won ? 1 : 0);
      const alienWins = (existing.alien_wins || 0) + (faction === 'alien' && won ? 1 : 0);
      const maxWins = Math.max(romanWins, vikingWins, alienWins);
      const favFaction = maxWins === romanWins ? 'roman' : maxWins === vikingWins ? 'viking' : 'alien';

      const { error } = await supabase
        .from('player_stats')
        .update({
          total_games: existing.total_games + 1,
          total_wins: existing.total_wins + (won ? 1 : 0),
          total_kills: existing.total_kills + kills,
          total_playtime_seconds: existing.total_playtime_seconds + Math.floor(timeSeconds),
          roman_wins: romanWins,
          viking_wins: vikingWins,
          alien_wins: alienWins,
          favorite_faction: favFaction,
          updated_at: new Date().toISOString(),
        })
        .eq('session_id', sessionId);
      if (error) console.warn('updatePlayerStats update error:', error.message);
    } else {
      const { error } = await supabase.from('player_stats').insert({
        session_id: sessionId,
        total_games: 1,
        total_wins: won ? 1 : 0,
        total_kills: kills,
        total_playtime_seconds: Math.floor(timeSeconds),
        favorite_faction: faction,
        roman_wins: faction === 'roman' && won ? 1 : 0,
        viking_wins: faction === 'viking' && won ? 1 : 0,
        alien_wins: faction === 'alien' && won ? 1 : 0,
      });
      if (error) console.warn('updatePlayerStats insert error:', error.message);
    }
  } catch (e) {
    console.warn('updatePlayerStats failed:', e);
  }
}
