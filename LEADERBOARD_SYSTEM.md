# Global Leaderboard System

## Overview
Added a global leaderboard to track and display player completion times for all three campaigns (Roman, Viking, and Alien).

## Features

### Leaderboard Scene
- **3 Tabs**: Switch between Roman, Viking, and Alien campaign leaderboards
- **Top 10 Display**: Shows the fastest completion times
- **Rank Colors**: Gold (1st), Silver (2nd), Bronze (3rd), White (4th-10th)
- **Player Stats**: Shows your personal best time and rank
- **Real-time Updates**: Automatically saves times when campaigns are completed

### Campaign Timing
- **Automatic Tracking**: Starts timing when level 1 begins
- **Total Time**: Tracks cumulative time across all 8 levels
- **Persistent**: Survives page refreshes and continues tracking

### Data Storage
- **localStorage Keys**:
  - `leaderboard_roman`: Top 100 Roman campaign times
  - `leaderboard_viking`: Top 100 Viking campaign times
  - `leaderboard_alien`: Top 100 Alien campaign times
  - `player_time_roman`: Your personal best Roman time
  - `player_time_viking`: Your personal best Viking time
  - `player_time_alien`: Your personal best Alien time
  - `roman_campaign_start`: Campaign start timestamp
  - `viking_campaign_start`: Campaign start timestamp
  - `alien_campaign_start`: Campaign start timestamp
  - `playerName`: Your display name (defaults to "Player")

## How It Works

### 1. Campaign Start (Level 1)
When you start level 1 of any campaign, the intro scene saves the start timestamp:
```javascript
localStorage.setItem('roman_campaign_start', Date.now().toString());
```

### 2. Campaign Completion (Level 8)
When you beat the final boss (level 8), Base.js:
1. Calculates total time: `endTime - startTime`
2. Passes time to CampaignCompleteScene
3. Clears the start timestamp

### 3. Leaderboard Update
CampaignCompleteScene automatically:
1. Gets player name from localStorage
2. Saves the completion time to leaderboard
3. Updates personal best if faster
4. Sorts by fastest time (top 100 kept)

### 4. Viewing Leaderboards
From main menu → **LEADERBOARD** button:
- See top 10 players for each campaign
- View your personal rank and best time
- Switch between campaigns with tabs

## Display Format
- **Time Format**: `MM:SS` or `H:MM:SS` for longer times
- **Date Format**: "Jan 1, 2024" (month day, year)
- **Player Names**: Customizable (defaults to "Player")

## Technical Details

### LeaderboardScene Methods
- `create()`: Initialize UI and load data
- `loadLeaderboardData()`: Load all campaign leaderboards
- `refreshLeaderboardContent()`: Update displayed entries
- `switchTab(campaign)`: Change active campaign view
- `static addCompletionTime(campaign, name, time)`: Save new completion

### Campaign Complete Flow
1. **Base.js** detects level 8 victory
2. Calculates total campaign time
3. Transitions to **CampaignCompleteScene**
4. Shows celebration + completion time
5. Saves to leaderboard automatically
6. Player can view their rank in LeaderboardScene

## Future Enhancements (Optional)
- Online backend for global leaderboards across all players
- Player profile system with avatars
- Speedrun mode with in-game timer display
- Replay system to review fast runs
- Achievements for top rankings
