# Splash Screen Implementation

## Overview
Added a professional splash screen that displays before the main menu, featuring the game's title logo with smooth animations.

## Changes Made

### 1. New File: SplashScene.js
- **Full screen dark background**: Deep purple/black gradient (#1a0033) matching menu aesthetic
- **Title logo**: "Blades, Beards & Beams" logo centered both vertically and horizontally
- **Smooth animations**:
  - Logo fades in over 1.5s (opacity 0 → 1)
  - Slight scale up from 0.95 to 1.0 for polish
  - Responsive scaling (fits 80% of screen while maintaining aspect ratio)
- **"CLICK TO START" text**:
  - Appears 1 second after logo fully visible
  - Gold/cream color (#F5DEB3)
  - Uppercase with 3px letter spacing
  - Pulsing animation (alpha 0.4 ↔ 1.0, 1.5s ease-in-out, infinite)
- **Interactive**:
  - Click anywhere to proceed
  - Keyboard support (Space or Enter)
  - Fade out transition (0.5s) to MenuScene

### 2. Updated: main.js
- Imported SplashScene
- Added SplashScene as first scene in scene array
- SplashScene now loads automatically on game start

### 3. Updated: index.html
- Changed page title from "LEGIONS" to "Blades, Beards & Beams"

## Screen Flow
```
SplashScene (NEW)
    ↓ (click/keyboard)
MenuScene (existing - unchanged)
    ↓ (campaign selection)
Game Scenes (all existing - unchanged)
```

## Technical Details

### Scene Lifecycle
1. **SplashScene loads** (automatic on game start)
2. **Logo preload** from assets
3. **Animations play**:
   - Background renders
   - Logo fades in + scales (1.5s)
   - Text appears (delay 2.5s total)
   - Text pulses continuously
4. **User input** triggers transition
5. **Fade out** (0.5s)
6. **MenuScene starts** (no changes to menu functionality)

### Responsive Design
- Logo scales to fit any screen size (max 80% width or 60% height)
- Maintains aspect ratio
- Text positioned at 80% of screen height
- Works on desktop and mobile

### Assets Used
- **Title Logo**: `https://rosebud.ai/assets/Screen Shot 2026-02-06 at 23.42.00 PM.png?doSZ`
- Logo features Roman eagle, Viking axe, and alien UFO with game title

## No Game Logic Changes
- ✅ All existing menu buttons work exactly the same
- ✅ All campaigns function identically
- ✅ No gameplay mechanics modified
- ✅ Leaderboard system unchanged
- ✅ All existing scenes preserved

The splash screen is purely a visual addition that creates a professional first impression before players reach the familiar main menu.
