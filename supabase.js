const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const createClient = window.supabase?.createClient;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

function getOrCreateSessionId() {
  let id = localStorage.getItem('gameSessionId');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('gameSessionId', id);
  }
  return id;
}

export const sessionId = getOrCreateSessionId();

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

export async function updatePlayerStats(won, faction, timeSeconds, kills) {
  try {
    const { data: existing } = await supabase
      .from('player_stats')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    const factionWinKey = `${faction}_wins`;

    if (existing) {
      const updates = {
        total_games: existing.total_games + 1,
        total_wins: existing.total_wins + (won ? 1 : 0),
        total_kills: existing.total_kills + kills,
        total_playtime_seconds: existing.total_playtime_seconds + Math.floor(timeSeconds),
        updated_at: new Date().toISOString(),
        [factionWinKey]: (existing[factionWinKey] || 0) + (won ? 1 : 0),
      };

      const maxWins = Math.max(updates.roman_wins || 0, updates.viking_wins || 0, updates.alien_wins || 0);
      if (maxWins === updates.roman_wins) updates.favorite_faction = 'roman';
      else if (maxWins === updates.viking_wins) updates.favorite_faction = 'viking';
      else updates.favorite_faction = 'alien';

      const { error } = await supabase
        .from('player_stats')
        .update(updates)
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
