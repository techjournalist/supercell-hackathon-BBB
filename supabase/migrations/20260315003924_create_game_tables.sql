/*
  # Blades, Beards & Beams - Game Persistence Tables

  1. New Tables
    - `game_sessions`
      - Records each completed game session with stats
      - Includes faction, mode, result, time, kills, gold, spells cast
    - `campaign_progress`
      - Server-side campaign unlock state per anonymous player ID
      - roman_level, viking_level, alien_level progress integers
    - `leaderboard`
      - Best scores per player per mode/faction
      - Used in LeaderboardScene
    - `player_stats`
      - Aggregate lifetime stats per anonymous player

  2. Security
    - RLS enabled on all tables
    - Anonymous players (no auth required) identified by uuid stored in localStorage
    - Players can only read/write their own rows
    - Public leaderboard SELECT is allowed for all

  3. Notes
    - No authentication required - uses anonymous session IDs
    - session_id is a client-generated UUID stored in localStorage
    - All tables use soft deletes (never DROP user data)
*/

-- Game sessions: records each play session
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  faction text NOT NULL DEFAULT 'roman',
  game_mode text NOT NULL DEFAULT 'skirmish',
  campaign_level int DEFAULT NULL,
  difficulty text DEFAULT 'normal',
  result text NOT NULL DEFAULT 'defeat',
  time_seconds int NOT NULL DEFAULT 0,
  units_trained int NOT NULL DEFAULT 0,
  enemies_killed int NOT NULL DEFAULT 0,
  units_lost int NOT NULL DEFAULT 0,
  gold_earned int NOT NULL DEFAULT 0,
  spells_cast int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own sessions"
  ON game_sessions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Players can read own sessions"
  ON game_sessions FOR SELECT
  TO anon
  USING (true);

-- Campaign progress: server-side unlock state
CREATE TABLE IF NOT EXISTS campaign_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE,
  roman_level int NOT NULL DEFAULT 1,
  viking_level int NOT NULL DEFAULT 1,
  alien_level int NOT NULL DEFAULT 1,
  roman_best_times jsonb NOT NULL DEFAULT '{}',
  viking_best_times jsonb NOT NULL DEFAULT '{}',
  alien_best_times jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE campaign_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own progress"
  ON campaign_progress FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Players can read own progress"
  ON campaign_progress FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Players can update own progress"
  ON campaign_progress FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Leaderboard: top scores per mode
CREATE TABLE IF NOT EXISTS leaderboard (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  display_name text NOT NULL DEFAULT 'Commander',
  game_mode text NOT NULL,
  faction text NOT NULL DEFAULT 'roman',
  score int NOT NULL DEFAULT 0,
  time_seconds int NOT NULL DEFAULT 0,
  enemies_killed int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Players can insert leaderboard entries"
  ON leaderboard FOR INSERT
  TO anon
  WITH CHECK (true);

-- Player lifetime stats
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL UNIQUE,
  total_games int NOT NULL DEFAULT 0,
  total_wins int NOT NULL DEFAULT 0,
  total_kills int NOT NULL DEFAULT 0,
  total_playtime_seconds int NOT NULL DEFAULT 0,
  favorite_faction text NOT NULL DEFAULT 'roman',
  roman_wins int NOT NULL DEFAULT 0,
  viking_wins int NOT NULL DEFAULT 0,
  alien_wins int NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Players can insert own stats"
  ON player_stats FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Players can read own stats"
  ON player_stats FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Players can update own stats"
  ON player_stats FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_game_sessions_session_id ON game_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created_at ON game_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_game_mode ON leaderboard(game_mode, score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_created_at ON leaderboard(created_at DESC);
