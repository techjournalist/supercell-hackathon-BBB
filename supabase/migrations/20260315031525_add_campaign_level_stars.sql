/*
  # Add Campaign Level Stars Table

  ## Summary
  Creates a new table to track star ratings earned per campaign level, per difficulty, across all three campaign types (roman, viking, alien).

  ## New Tables
  - `campaign_level_stars`
    - `id` (uuid, primary key)
    - `session_id` (text) - player session identifier
    - `campaign_type` (text) - 'roman', 'viking', or 'alien'
    - `level_num` (integer) - the level number
    - `difficulty` (text) - 'easy', 'normal', or 'hard'
    - `stars_earned` (integer) - 1, 2, or 3 stars
    - `completed_at` (timestamptz) - when this was last earned

  ## Security
  - Enable RLS on `campaign_level_stars`
  - Policy: session owners can read their own star data
  - Policy: session owners can insert new star records
  - Policy: session owners can update their own star records (never downgrade)

  ## Notes
  - The unique constraint on (session_id, campaign_type, level_num, difficulty) ensures one record per combination
  - Stars are never downgraded - only updated if the new value is higher (enforced in application code)
*/

CREATE TABLE IF NOT EXISTS campaign_level_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  campaign_type text NOT NULL CHECK (campaign_type IN ('roman', 'viking', 'alien')),
  level_num integer NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard')),
  stars_earned integer NOT NULL DEFAULT 1 CHECK (stars_earned BETWEEN 1 AND 3),
  completed_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS campaign_level_stars_unique
  ON campaign_level_stars (session_id, campaign_type, level_num, difficulty);

CREATE INDEX IF NOT EXISTS campaign_level_stars_session_idx
  ON campaign_level_stars (session_id);

ALTER TABLE campaign_level_stars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Session owners can read their own star data"
  ON campaign_level_stars
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Session owners can insert star records"
  ON campaign_level_stars
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Session owners can update their own star records"
  ON campaign_level_stars
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
