import * as Tone from 'tone';
import { AudioManager } from './AudioManager.js';

/**
 * SoundEffectsManager - Procedural sound effects using Tone.js
 * Handles unit movement, combat, and other game sounds
 */
export class SoundEffectsManager {
  constructor() {
    this.initialized = false;
    this.synths = {};
    this.panners = {};
    this.activeNotes = new Map();
    
    // Track last play time for each sound to prevent rapid retriggering
    this.lastPlayTime = new Map();
    
    // Minimum delay between sound plays (in milliseconds)
    this.minDelays = {
      footstep: 50,
      wingFlap: 50,
      melee: 50,
      laser: 50,
      impact: 30,
      explosion: 100,
      death: 100,
      ui: 50,
      spell: 100
    };
    
    // Volume multipliers for different sound categories
    this.categoryVolumes = {
      movement: 0.15,
      combat: 0.35,
      spell: 0.4,
      ui: 0.25,
      ambient: 0.2
    };
    
    // Camera and screen dimensions for spatial audio calculations
    this.cameraX = 0;
    this.cameraY = 0;
    this.screenWidth = 1280;
    this.screenHeight = 720;
  }
  
  /**
   * Initialize Tone.js and create synth instruments
   * Must be called after user interaction due to browser autoplay policies
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      await Tone.start();
      console.log('Tone.js audio context started');
      
      // Create master volume control
      this.masterVolume = new Tone.Volume(0).toDestination();
      
      // Create synths for different sound types
      this.createMovementSynths();
      this.createCombatSynths();
      this.createSpellSynths();
      this.createUISynths();
      
      this.initialized = true;
      console.log('SoundEffectsManager initialized');
    } catch (error) {
      console.error('Failed to initialize SoundEffectsManager:', error);
    }
  }
  
  /**
   * Create synths for unit movement sounds
   */
  createMovementSynths() {
    // Footstep synth - short percussive sound with panner
    this.panners.footstep = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.footstep = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    }).connect(this.panners.footstep);
    
    // Wing flap synth for flying units with panner
    this.panners.wingFlap = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.wingFlap = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0,
        release: 0.05
      }
    }).connect(this.panners.wingFlap);
    
    // Hover synth for alien units with panner
    this.panners.hover = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.hover = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.1,
        sustain: 0.3,
        release: 0.2
      }
    }).connect(this.panners.hover);
  }
  
  /**
   * Create synths for combat sounds
   */
  createCombatSynths() {
    // Sword/melee attack synth - Use PolySynth for multiple simultaneous attacks with panner
    this.panners.melee = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.melee = new Tone.PolySynth(Tone.MetalSynth, {
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.2
      },
      harmonicity: 12,
      modulationIndex: 20,
      resonance: 800,
      octaves: 1
    }).connect(this.panners.melee);
    this.synths.melee.maxPolyphony = 16;
    
    // Laser/energy weapon synth - Use PolySynth for multiple simultaneous lasers with panner
    this.panners.laser = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.laser = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).connect(this.panners.laser);
    this.synths.laser.maxPolyphony = 16;
    
    // Impact/hit synth with panner
    this.panners.impact = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.impact = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    }).connect(this.panners.impact);
    
    // Explosion synth with panner
    this.panners.explosion = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.explosion = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.4
      }
    }).connect(this.panners.explosion);
  }
  
  /**
   * Create synths for spell/ability sounds
   */
  createSpellSynths() {
    // Heal spell - ascending notes with panner
    this.panners.heal = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.heal = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.1,
        release: 0.3
      }
    }).connect(this.panners.heal);
    
    // Lightning spell - crackling energy with panner
    this.panners.lightning = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.lightning = new Tone.FMSynth({
      harmonicity: 8,
      modulationIndex: 20,
      oscillator: { type: 'sawtooth' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).connect(this.panners.lightning);
    
    // Fireball - whoosh sound with panner
    this.panners.fireball = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.fireball = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0,
        release: 0.2
      }
    }).connect(this.panners.fireball);
    
    // Mind control - eerie psychic sound with panner
    this.panners.mindControl = new Tone.Panner(0).connect(this.masterVolume);
    this.synths.mindControl = new Tone.AMSynth({
      harmonicity: 3,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.2,
        decay: 0.3,
        sustain: 0.2,
        release: 0.5
      }
    }).connect(this.panners.mindControl);
  }
  
  /**
   * Create synths for UI sounds
   */
  createUISynths() {
    // Button click
    this.synths.click = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.001,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    }).connect(this.masterVolume);
    
    // Button hover
    this.synths.hover_ui = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.05,
        sustain: 0,
        release: 0.05
      }
    }).connect(this.masterVolume);
    
    // Resource collected
    this.synths.collect = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.1,
        release: 0.2
      }
    }).connect(this.masterVolume);
  }
  
  /**
   * Check if enough time has passed since last play
   * @param {string} soundKey - Key to track (e.g., 'footstep', 'melee')
   * @returns {boolean} True if sound can be played
   */
  canPlaySound(soundKey) {
    const now = Date.now();
    const lastTime = this.lastPlayTime.get(soundKey) || 0;
    const minDelay = this.minDelays[soundKey] || 50;
    
    if (now - lastTime >= minDelay) {
      this.lastPlayTime.set(soundKey, now);
      return true;
    }
    return false;
  }
  
  /**
   * Update master volume based on AudioManager settings
   */
  updateVolume() {
    if (!this.initialized) return;
    
    const effectsVolume = AudioManager.getEffectiveVolume('sfx');
    // Convert 0-1 range to decibels (-40 to 0 dB)
    const dbVolume = effectsVolume === 0 ? -100 : (effectsVolume - 1) * 40;
    this.masterVolume.volume.value = dbVolume;
  }
  
  /**
   * Get effective volume for a sound category
   */
  getCategoryVolume(category) {
    const baseVolume = AudioManager.getEffectiveVolume('sfx');
    const categoryMultiplier = this.categoryVolumes[category] || 0.3;
    return baseVolume * categoryMultiplier;
  }
  
  /**
   * Update camera position for spatial audio calculations
   * Should be called each frame from GameScene
   * @param {number} x - Camera center X in world coordinates
   * @param {number} y - Camera center Y in world coordinates
   * @param {number} width - Screen width in pixels
   * @param {number} height - Screen height in pixels
   */
  updateCameraPosition(x, y, width, height) {
    this.cameraX = x;
    this.cameraY = y;
    this.screenWidth = width;
    this.screenHeight = height;
  }
  
  /**
   * Calculate stereo pan value based on world position
   * @param {number} worldX - X position in world coordinates
   * @param {number} worldY - Y position in world coordinates (optional, for distance calculation)
   * @returns {number} Pan value from -1 (left) to 1 (right)
   */
  calculatePan(worldX, worldY = null) {
    // Calculate horizontal offset from camera center
    const offsetX = worldX - this.cameraX;
    
    // Calculate pan based on position relative to screen width
    // Objects at screen edges get full -1 or 1 pan
    const halfScreenWidth = this.screenWidth / 2;
    let pan = offsetX / halfScreenWidth;
    
    // Clamp to -1 to 1 range
    pan = Math.max(-1, Math.min(1, pan));
    
    // Optional: Reduce panning for sounds far off screen to avoid jarring effects
    const maxPanDistance = this.screenWidth * 1.5;
    const distance = Math.abs(offsetX);
    if (distance > maxPanDistance) {
      // Gradually reduce pan strength for very distant sounds
      const distanceFactor = Math.max(0, 1 - (distance - maxPanDistance) / maxPanDistance);
      pan *= distanceFactor;
    }
    
    return pan;
  }
  
  /**
   * Set panning for a specific sound channel
   * @param {string} channel - Channel name (e.g., 'footstep', 'melee')
   * @param {number} worldX - X position in world coordinates
   * @param {number} worldY - Y position in world coordinates (optional)
   */
  setPan(channel, worldX, worldY = null) {
    if (!this.initialized || !this.panners[channel]) return;
    
    const pan = this.calculatePan(worldX, worldY);
    this.panners[channel].pan.value = pan;
  }
  
  // ============================================================================
  // MOVEMENT SOUNDS
  // ============================================================================
  
  /**
   * Play footstep sound for ground units
   * @param {string} faction - 'roman', 'viking', 'alien'
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playFootstep(faction = 'roman', x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('footstep')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('footstep', x, y);
    }
    
    // Different pitch for different factions
    const pitches = {
      roman: 'C2',
      viking: 'A1',
      alien: 'E2'
    };
    
    const pitch = pitches[faction] || 'C2';
    const volume = this.getCategoryVolume('movement');
    
    this.synths.footstep.volume.value = Tone.gainToDb(volume);
    this.synths.footstep.triggerAttackRelease(pitch, '32n');
  }
  
  /**
   * Play wing flap sound for flying units
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playWingFlap(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('wingFlap')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('wingFlap', x, y);
    }
    
    const volume = this.getCategoryVolume('movement');
    
    this.synths.wingFlap.volume.value = Tone.gainToDb(volume);
    this.synths.wingFlap.triggerAttackRelease('16n');
  }
  
  /**
   * Play hover sound for alien units (looping)
   * @param {string} unitId - Unique ID for the unit
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playHoverStart(unitId, x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('hover', x, y);
    }
    
    const volume = this.getCategoryVolume('movement') * 0.5; // Quieter for looping
    
    this.synths.hover.volume.value = Tone.gainToDb(volume);
    this.synths.hover.triggerAttack('G3');
    this.activeNotes.set(unitId, 'hover');
  }
  
  /**
   * Stop hover sound for a unit
   * @param {string} unitId - Unique ID for the unit
   */
  playHoverStop(unitId) {
    if (!this.initialized) return;
    
    if (this.activeNotes.has(unitId)) {
      this.synths.hover.triggerRelease();
      this.activeNotes.delete(unitId);
    }
  }
  
  // ============================================================================
  // COMBAT SOUNDS
  // ============================================================================
  
  /**
   * Play melee attack sound
   * @param {string} faction - 'roman', 'viking', 'alien'
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playMeleeAttack(faction = 'roman', x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('melee')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('melee', x, y);
    }
    
    const volume = this.getCategoryVolume('combat');
    
    // Different frequencies for different attack styles
    const frequencies = {
      roman: 200,
      viking: 150,
      alien: 300
    };
    
    const frequency = frequencies[faction] || 200;
    this.synths.melee.volume.value = Tone.gainToDb(volume);
    
    // For PolySynth, we trigger with a note/frequency
    this.synths.melee.triggerAttackRelease(frequency, '16n');
  }
  
  /**
   * Play laser/energy weapon sound
   * @param {string} pitch - Musical note or frequency
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playLaser(pitch = 'C5', x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('laser')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('laser', x, y);
    }
    
    const volume = this.getCategoryVolume('combat');
    
    this.synths.laser.volume.value = Tone.gainToDb(volume);
    
    // Simplified laser sound for PolySynth - just play a descending note
    this.synths.laser.triggerAttackRelease(pitch, '8n');
  }
  
  /**
   * Play impact/hit sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playImpact(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('impact')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('impact', x, y);
    }
    
    const volume = this.getCategoryVolume('combat');
    
    this.synths.impact.volume.value = Tone.gainToDb(volume);
    this.synths.impact.triggerAttackRelease('32n');
  }
  
  /**
   * Play explosion sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playExplosion(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('explosion')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('explosion', x, y);
    }
    
    const volume = this.getCategoryVolume('combat');
    
    this.synths.explosion.volume.value = Tone.gainToDb(volume);
    this.synths.explosion.triggerAttackRelease('4n');
  }
  
  /**
   * Play unit death sound
   * @param {string} faction - 'roman', 'viking', 'alien'
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playUnitDeath(faction = 'roman', x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('death')) return;
    
    // Combination of impact and a descending tone
    this.playImpact(x, y);
    
    setTimeout(() => {
      // Set spatial panning if position provided
      if (x !== null) {
        this.setPan('laser', x, y);
      }
      
      const volume = this.getCategoryVolume('combat') * 0.7;
      this.synths.laser.volume.value = Tone.gainToDb(volume);
      // PolySynth needs note specified in triggerAttackRelease, not via frequency.rampTo
      this.synths.laser.triggerAttackRelease('C2', '0.3');
    }, 50);
  }
  
  // ============================================================================
  // SPELL SOUNDS
  // ============================================================================
  
  /**
   * Play heal spell sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playHealSpell(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('spell')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('heal', x, y);
    }
    
    const volume = this.getCategoryVolume('spell');
    
    this.synths.heal.volume.value = Tone.gainToDb(volume);
    
    // Ascending arpeggio
    const notes = ['C4', 'E4', 'G4', 'C5'];
    notes.forEach((note, i) => {
      setTimeout(() => {
        this.synths.heal.triggerAttackRelease(note, '16n');
      }, i * 80);
    });
  }
  
  /**
   * Play lightning spell sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playLightningSpell(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('spell')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('lightning', x, y);
    }
    
    const volume = this.getCategoryVolume('spell');
    
    this.synths.lightning.volume.value = Tone.gainToDb(volume);
    
    // Multiple rapid strikes
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        const pitch = 800 + Math.random() * 400;
        this.synths.lightning.frequency.value = pitch;
        this.synths.lightning.triggerAttackRelease('32n');
      }, i * 50);
    }
  }
  
  /**
   * Play fireball spell sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playFireballSpell(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('spell')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('fireball', x, y);
    }
    
    const volume = this.getCategoryVolume('spell');
    
    this.synths.fireball.volume.value = Tone.gainToDb(volume);
    
    // Whoosh followed by explosion
    this.synths.fireball.triggerAttackRelease('C3', '8n');
    setTimeout(() => {
      this.playExplosion(x, y);
    }, 200);
  }
  
  /**
   * Play mind control spell sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playMindControlSpell(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('spell')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('mindControl', x, y);
    }
    
    const volume = this.getCategoryVolume('spell');
    
    this.synths.mindControl.volume.value = Tone.gainToDb(volume);
    this.synths.mindControl.triggerAttackRelease('G3', '2n');
  }
  
  /**
   * Play generic spell cast sound
   * @param {number} x - World X position (optional, for spatial audio)
   * @param {number} y - World Y position (optional, for spatial audio)
   */
  playSpellCast(x = null, y = null) {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('spell')) return;
    
    this.updateVolume();
    
    // Set spatial panning if position provided
    if (x !== null) {
      this.setPan('heal', x, y);
    }
    
    const volume = this.getCategoryVolume('spell');
    
    this.synths.heal.volume.value = Tone.gainToDb(volume);
    this.synths.heal.triggerAttackRelease('A4', '8n');
  }
  
  // ============================================================================
  // UI SOUNDS
  // ============================================================================
  
  /**
   * Play button click sound
   */
  playButtonClick() {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('ui')) return;
    
    this.updateVolume();
    const volume = this.getCategoryVolume('ui');
    
    this.synths.click.volume.value = Tone.gainToDb(volume);
    this.synths.click.triggerAttackRelease('C5', '32n');
  }
  
  /**
   * Play button hover sound
   */
  playButtonHover() {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('ui')) return;
    
    this.updateVolume();
    const volume = this.getCategoryVolume('ui') * 0.6;
    
    this.synths.hover_ui.volume.value = Tone.gainToDb(volume);
    this.synths.hover_ui.triggerAttackRelease('A4', '64n');
  }
  
  /**
   * Play resource collected sound
   */
  playResourceCollected() {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('ui')) return;
    
    this.updateVolume();
    const volume = this.getCategoryVolume('ui');
    
    this.synths.collect.volume.value = Tone.gainToDb(volume);
    
    // Two-note ding
    this.synths.collect.triggerAttackRelease('C5', '16n');
    setTimeout(() => {
      this.synths.collect.triggerAttackRelease('E5', '16n');
    }, 100);
  }
  
  /**
   * Play unit trained/spawned sound
   */
  playUnitTrained() {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('ui')) return;
    
    this.updateVolume();
    const volume = this.getCategoryVolume('ui');
    
    this.synths.collect.volume.value = Tone.gainToDb(volume);
    this.synths.collect.triggerAttackRelease('G4', '8n');
  }
  
  /**
   * Play error/invalid action sound
   */
  playError() {
    if (!this.initialized || !AudioManager.shouldPlaySFX()) return;
    if (!this.canPlaySound('ui')) return;
    
    this.updateVolume();
    const volume = this.getCategoryVolume('ui');
    
    this.synths.click.volume.value = Tone.gainToDb(volume);
    this.synths.click.triggerAttackRelease('C3', '16n');
  }
  
  // ============================================================================
  // UTILITY
  // ============================================================================
  
  /**
   * Stop all active sounds
   */
  stopAll() {
    if (!this.initialized) return;
    
    Object.values(this.synths).forEach(synth => {
      if (synth.triggerRelease) {
        synth.triggerRelease();
      }
    });
    
    this.activeNotes.clear();
  }
  
  /**
   * Cleanup and dispose of all synths
   */
  dispose() {
    if (!this.initialized) return;
    
    this.stopAll();
    
    Object.values(this.synths).forEach(synth => {
      synth.dispose();
    });
    
    if (this.masterVolume) {
      this.masterVolume.dispose();
    }
    
    this.synths = {};
    this.initialized = false;
    console.log('SoundEffectsManager disposed');
  }
}

// Create singleton instance
export const soundEffects = new SoundEffectsManager();
