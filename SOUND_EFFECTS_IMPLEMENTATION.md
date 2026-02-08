# Sound Effects Manager Implementation

## Overview
Created a comprehensive procedural sound effects system using Tone.js that generates all game sounds dynamically without requiring audio files.

## Files Created/Modified

### New Files
- `/SoundEffectsManager.js` - Complete sound effects system with Tone.js synths

### Modified Files
- `/GameScene.js` - Integrated sound effects initialization and UI button sounds
- `/Unit.js` - Attack, impact, death, and movement sounds
- `/Worker.js` - Resource collection sounds

## Sound Categories

### 1. Movement Sounds
**Footsteps** (`playFootstep(faction)`)
- Plays on each step during unit walking animation
- Different pitches per faction:
  - Roman: C2 (deeper, marching sound)
  - Viking: A1 (heavy, powerful)
  - Alien: E2 (higher, otherworldly)
- Automatically triggered when walk phase crosses PI intervals

**Wing Flap** (`playWingFlap()`)
- For flying units (if implemented)
- Short burst of pink noise

**Hover** (`playHoverStart(unitId)`, `playHoverStop(unitId)`)
- Continuous sound for alien hover units
- Looping sine wave at G3
- Tracked per unit ID for proper cleanup

### 2. Combat Sounds
**Melee Attacks** (`playMeleeAttack(faction)`)
- MetalSynth for sword/weapon clashes
- Faction-specific frequencies:
  - Roman: 200 Hz
  - Viking: 150 Hz (deeper)
  - Alien: 300 Hz (higher pitched)

**Laser/Energy Weapons** (`playLaser(pitch)`)
- Descending sawtooth synth
- Creates "pew pew" sci-fi effect
- Used for ranged attacks

**Impact** (`playImpact()`)
- White noise burst
- Plays when units take damage
- Very short (50ms) percussive hit

**Explosion** (`playExplosion()`)
- Brown noise with longer decay
- Used for area damage effects

**Unit Death** (`playUnitDeath(faction)`)
- Combination of impact + descending tone
- Creates dramatic death effect

### 3. Spell Sounds
**Heal Spell** (`playHealSpell()`)
- Ascending arpeggio (C4→E4→G4→C5)
- Gentle sine wave
- 80ms intervals between notes

**Lightning Spell** (`playLightningSpell()`)
- FM synthesis with high harmonicity
- 3 rapid strikes with random pitch variation
- Crackling energy effect

**Fireball Spell** (`playFireballSpell()`)
- Whoosh sound followed by explosion
- Triangle wave + explosion synth combo

**Mind Control** (`playMindControlSpell()`)
- AM synthesis for eerie psychic effect
- Long attack/release for otherworldly feel

**Generic Spell Cast** (`playSpellCast()`)
- Simple bright tone for buff spells
- Used for Shield Wall and other utility spells

### 4. UI Sounds
**Button Click** (`playButtonClick()`)
- Quick triangle wave at C5
- Satisfying tactile feedback
- 50ms duration

**Button Hover** (`playButtonHover()`)
- Subtle sine wave at A4
- Quieter than click (60% volume)
- Very short (25ms)

**Resource Collected** (`playResourceCollected()`)
- Two-note "ding" (C5→E5)
- Plays when workers deposit gold
- 100ms delay between notes

**Unit Trained** (`playUnitTrained()`)
- Single note at G4
- Confirms successful unit creation

**Error** (`playError()`)
- Low pitch (C3) for invalid actions
- Used when player can't afford something

## Technical Implementation

### Volume Management
- Master volume control via `AudioManager`
- Category-specific volume multipliers:
  - Movement: 15% (subtle background)
  - Combat: 35% (prominent)
  - Spell: 40% (impactful)
  - UI: 25% (noticeable but not intrusive)
  - Ambient: 20% (atmospheric)

### Synth Architecture
- **MembraneSynth**: Footsteps (percussive, drum-like)
- **NoiseSynth**: Wing flaps, impacts (textured)
- **MetalSynth**: Melee attacks (metallic clash)
- **Synth**: Lasers, spells, UI (tonal)
- **FMSynth**: Lightning (complex harmonics)
- **AMSynth**: Mind control (modulated, eerie)

### Initialization
- Lazy initialization on first user interaction (browser autoplay policy)
- All synths connected to master volume node
- Automatic volume updates from AudioManager

### Performance
- Synths created once and reused
- Active notes tracked for cleanup
- No audio file loading (procedural generation only)

## Integration Points

### Unit.js
1. **Attack animations** → `playMeleeAttack()` or `playLaser()`
2. **Taking damage** → `playImpact()`
3. **Death** → `playUnitDeath()`
4. **Movement** → `playFootstep()` every step

### Worker.js
1. **Gold deposited** → `playResourceCollected()`

### GameScene.js
1. **Button interactions** → `playButtonClick()`, `playButtonHover()`
2. **Spell casting** → Spell-specific sounds
3. **Unit training** → `playUnitTrained()`
4. **Initialization** → Triggered on first click

## Usage Examples

```javascript
// Play faction-specific footstep
soundEffects.playFootstep('roman');

// Play melee attack
soundEffects.playMeleeAttack('viking');

// Play spell
soundEffects.playHealSpell();

// Play UI feedback
soundEffects.playButtonClick();

// Check if initialized
if (!soundEffects.initialized) {
  await soundEffects.initialize();
}

// Update volume when settings change
soundEffects.updateVolume();

// Stop all sounds (e.g., when scene ends)
soundEffects.stopAll();

// Clean up (e.g., on game shutdown)
soundEffects.dispose();
```

## Benefits

1. **No Asset Management**: All sounds generated procedurally
2. **Lightweight**: No audio file downloads
3. **Dynamic**: Sounds adapt to game state (faction, volume, etc.)
4. **Consistent**: Integrated with existing AudioManager
5. **Scalable**: Easy to add new sound types
6. **Professional**: Polished audio feedback throughout the game

## Future Enhancements (Optional)

1. **Positional Audio**: Add panning based on unit position
2. **Environmental Effects**: Reverb for caves, echo for canyons
3. **Dynamic Mixing**: Ducking when important events occur
4. **Ambient Soundscapes**: Procedural background ambience per faction
5. **More Variety**: Randomized pitch/timbre per sound trigger
