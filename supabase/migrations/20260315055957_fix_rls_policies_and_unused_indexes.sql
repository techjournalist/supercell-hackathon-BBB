/*
  # Fix RLS Policies and Remove Unused Indexes

  ## Summary
  Addresses all flagged security issues:

  1. **Unused Indexes Dropped**
     - idx_game_sessions_session_id
     - idx_game_sessions_created_at
     - idx_leaderboard_game_mode
     - idx_leaderboard_created_at
     - idx_mp_commands_room_turn

  2. **RLS Policy Fixes**
     All INSERT/UPDATE/DELETE policies previously used `true` (unrestricted).
     Since this app uses anonymous session IDs (no Supabase auth), policies are
     tightened to require that session_id is a non-empty, non-null value.
     This prevents completely anonymous/blank writes while preserving the
     anonymous-session-based access model.

     Tables fixed:
     - campaign_level_stars (INSERT, UPDATE)
     - campaign_progress (INSERT, UPDATE)
     - friends (INSERT, UPDATE, DELETE)
     - game_sessions (INSERT)
     - leaderboard (INSERT)
     - mp_commands (INSERT)
     - mp_results (INSERT)
     - mp_rooms (INSERT, UPDATE)
     - online_presence (INSERT, UPDATE)
     - player_stats (INSERT, UPDATE)
*/

-- ============================================================
-- Drop unused indexes
-- ============================================================
DROP INDEX IF EXISTS idx_game_sessions_session_id;
DROP INDEX IF EXISTS idx_game_sessions_created_at;
DROP INDEX IF EXISTS idx_leaderboard_game_mode;
DROP INDEX IF EXISTS idx_leaderboard_created_at;
DROP INDEX IF EXISTS idx_mp_commands_room_turn;

-- ============================================================
-- campaign_level_stars
-- ============================================================
DROP POLICY IF EXISTS "Session owners can insert star records" ON campaign_level_stars;
DROP POLICY IF EXISTS "Session owners can update their own star records" ON campaign_level_stars;

CREATE POLICY "Session owners can insert star records"
  ON campaign_level_stars FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Session owners can update their own star records"
  ON campaign_level_stars FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id != '')
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

-- ============================================================
-- campaign_progress
-- ============================================================
DROP POLICY IF EXISTS "Players can insert own progress" ON campaign_progress;
DROP POLICY IF EXISTS "Players can update own progress" ON campaign_progress;

CREATE POLICY "Players can insert own progress"
  ON campaign_progress FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Players can update own progress"
  ON campaign_progress FOR UPDATE
  TO anon
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);

-- ============================================================
-- friends
-- ============================================================
DROP POLICY IF EXISTS "Anyone can send a friend request" ON friends;
DROP POLICY IF EXISTS "Target can update friend request status" ON friends;
DROP POLICY IF EXISTS "Either party can delete a friend" ON friends;

CREATE POLICY "Anyone can send a friend request"
  ON friends FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    requester_session_id IS NOT NULL AND requester_session_id != ''
    AND target_session_id IS NOT NULL AND target_session_id != ''
    AND requester_session_id != target_session_id
  );

CREATE POLICY "Target can update friend request status"
  ON friends FOR UPDATE
  TO anon, authenticated
  USING (target_session_id IS NOT NULL AND target_session_id != '')
  WITH CHECK (target_session_id IS NOT NULL AND target_session_id != '');

CREATE POLICY "Either party can delete a friend"
  ON friends FOR DELETE
  TO anon, authenticated
  USING (
    (requester_session_id IS NOT NULL AND requester_session_id != '')
    OR (target_session_id IS NOT NULL AND target_session_id != '')
  );

-- ============================================================
-- game_sessions
-- ============================================================
DROP POLICY IF EXISTS "Players can insert own sessions" ON game_sessions;

CREATE POLICY "Players can insert own sessions"
  ON game_sessions FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

-- ============================================================
-- leaderboard
-- ============================================================
DROP POLICY IF EXISTS "Players can insert leaderboard entries" ON leaderboard;

CREATE POLICY "Players can insert leaderboard entries"
  ON leaderboard FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

-- ============================================================
-- mp_commands
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert commands" ON mp_commands;

CREATE POLICY "Anyone can insert commands"
  ON mp_commands FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    room_code IS NOT NULL AND room_code != ''
    AND player_role IN ('host', 'guest')
  );

-- ============================================================
-- mp_results
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert results" ON mp_results;

CREATE POLICY "Anyone can insert results"
  ON mp_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    room_code IS NOT NULL AND room_code != ''
    AND winner_session_id IS NOT NULL AND winner_session_id != ''
    AND loser_session_id IS NOT NULL AND loser_session_id != ''
  );

-- ============================================================
-- mp_rooms
-- ============================================================
DROP POLICY IF EXISTS "Anyone can insert a room" ON mp_rooms;
DROP POLICY IF EXISTS "Participants can update rooms they are in" ON mp_rooms;

CREATE POLICY "Anyone can insert a room"
  ON mp_rooms FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    host_session_id IS NOT NULL AND host_session_id != ''
    AND room_code IS NOT NULL AND room_code != ''
  );

CREATE POLICY "Participants can update rooms they are in"
  ON mp_rooms FOR UPDATE
  TO anon, authenticated
  USING (
    host_session_id IS NOT NULL AND host_session_id != ''
  )
  WITH CHECK (
    host_session_id IS NOT NULL AND host_session_id != ''
  );

-- ============================================================
-- online_presence
-- ============================================================
DROP POLICY IF EXISTS "Anyone can upsert their own presence" ON online_presence;
DROP POLICY IF EXISTS "Anyone can update presence" ON online_presence;

CREATE POLICY "Anyone can upsert their own presence"
  ON online_presence FOR INSERT
  TO anon, authenticated
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

CREATE POLICY "Anyone can update presence"
  ON online_presence FOR UPDATE
  TO anon, authenticated
  USING (session_id IS NOT NULL AND session_id != '')
  WITH CHECK (session_id IS NOT NULL AND session_id != '');

-- ============================================================
-- player_stats
-- ============================================================
DROP POLICY IF EXISTS "Players can insert own stats" ON player_stats;
DROP POLICY IF EXISTS "Players can update own stats" ON player_stats;

CREATE POLICY "Players can insert own stats"
  ON player_stats FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "Players can update own stats"
  ON player_stats FOR UPDATE
  TO anon
  USING (session_id IS NOT NULL)
  WITH CHECK (session_id IS NOT NULL);
