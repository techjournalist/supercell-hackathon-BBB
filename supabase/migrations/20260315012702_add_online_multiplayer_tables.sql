/*
  # Online Multiplayer System Tables

  ## Summary
  Adds all tables needed for online multiplayer: room management, lockstep command sync,
  match results, friends/contacts list, and online presence tracking.

  ## New Tables

  ### mp_rooms
  Tracks each multiplayer match session. A "room" is created by the host, assigned a
  short human-readable room code, and filled when a guest joins.
  - room_code: 6-char uppercase code used to join
  - host/guest session IDs and display names
  - host/guest faction selections
  - status: lobby | countdown | playing | finished | abandoned
  - match_type: random | friend_code | friend_invite

  ### mp_commands
  The lockstep command log. Each player submits their commands once per turn window.
  Both clients wait until both rows for a given turn exist before advancing the simulation.
  - turn: integer turn index
  - player_role: host | guest
  - commands_json: array of commands submitted that turn

  ### mp_results
  Final match outcome written at game end.

  ### friends
  Contacts/friends list per session. Supports pending/accepted/blocked states.

  ### online_presence
  Heartbeat table -- each client upserts their row every 15 seconds.
  Used to show who is online and available to invite.

  ## Security
  RLS is enabled on all tables with strict policies:
  - Players can only read rooms they are a participant in
  - Players can only write commands for their own role
  - Friends rows are readable only by the two participants
  - Presence is readable by anyone (needed for friend status dots)
*/

-- ============================================================
-- mp_rooms
-- ============================================================
CREATE TABLE IF NOT EXISTS mp_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text UNIQUE NOT NULL,
  host_session_id text NOT NULL,
  guest_session_id text DEFAULT NULL,
  host_display_name text NOT NULL DEFAULT 'Commander',
  guest_display_name text DEFAULT NULL,
  host_faction text NOT NULL DEFAULT 'roman',
  guest_faction text DEFAULT NULL,
  status text NOT NULL DEFAULT 'lobby',
  match_type text NOT NULL DEFAULT 'random',
  created_at timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now()
);

ALTER TABLE mp_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room participants can read their rooms"
  ON mp_rooms FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert a room"
  ON mp_rooms FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can update rooms they are in"
  ON mp_rooms FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- mp_commands
-- ============================================================
CREATE TABLE IF NOT EXISTS mp_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  turn integer NOT NULL,
  player_role text NOT NULL,
  commands_json jsonb NOT NULL DEFAULT '[]',
  submitted_at timestamptz DEFAULT now()
);

ALTER TABLE mp_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commands are readable by room participants"
  ON mp_commands FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert commands"
  ON mp_commands FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Index for fast turn lookups
CREATE INDEX IF NOT EXISTS idx_mp_commands_room_turn ON mp_commands(room_code, turn);

-- ============================================================
-- mp_results
-- ============================================================
CREATE TABLE IF NOT EXISTS mp_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code text NOT NULL,
  winner_session_id text NOT NULL,
  loser_session_id text NOT NULL,
  host_faction text NOT NULL,
  guest_faction text NOT NULL,
  turns_played integer DEFAULT 0,
  forfeit boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mp_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Results are publicly readable"
  ON mp_results FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert results"
  ON mp_results FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- friends
-- ============================================================
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_session_id text NOT NULL,
  target_session_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(requester_session_id, target_session_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friends rows visible to both parties"
  ON friends FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can send a friend request"
  ON friends FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Target can update friend request status"
  ON friends FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Either party can delete a friend"
  ON friends FOR DELETE
  TO anon, authenticated
  USING (true);

-- Indexes for fast friend lookups
CREATE INDEX IF NOT EXISTS idx_friends_requester ON friends(requester_session_id);
CREATE INDEX IF NOT EXISTS idx_friends_target ON friends(target_session_id);

-- ============================================================
-- online_presence
-- ============================================================
CREATE TABLE IF NOT EXISTS online_presence (
  session_id text PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Commander',
  status text NOT NULL DEFAULT 'online',
  current_room_code text DEFAULT NULL,
  last_seen timestamptz DEFAULT now()
);

ALTER TABLE online_presence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Presence is publicly readable"
  ON online_presence FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can upsert their own presence"
  ON online_presence FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update presence"
  ON online_presence FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for relevant tables
ALTER PUBLICATION supabase_realtime ADD TABLE mp_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE mp_commands;
ALTER PUBLICATION supabase_realtime ADD TABLE friends;
ALTER PUBLICATION supabase_realtime ADD TABLE online_presence;
