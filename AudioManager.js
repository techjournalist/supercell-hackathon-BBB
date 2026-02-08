// Audio Manager - Centralized audio control for music and sound effects
export class AudioManager {
  static isMusicEnabled() {
    return localStorage.getItem('musicEnabled') !== 'false';
  }
  
  static isSFXEnabled() {
    return localStorage.getItem('sfxEnabled') !== 'false';
  }
  
  static getMasterVolume() {
    return parseFloat(localStorage.getItem('gameVolume') || '0.7');
  }
  
  static shouldPlayMusic() {
    return this.isMusicEnabled() && this.getMasterVolume() > 0;
  }
  
  static shouldPlaySFX() {
    return this.isSFXEnabled() && this.getMasterVolume() > 0;
  }
  
  // Play a sound effect (Tone.js synth) if SFX is enabled
  static playSFX(callback) {
    if (this.shouldPlaySFX()) {
      callback();
    }
  }
  
  // Play positional sound effect with panning based on x position
  // x: world x position of sound source
  // cameraX: camera scroll x position
  // worldWidth: total world width
  static playPositionalSFX(callback, x, cameraX, screenWidth, worldWidth) {
    if (this.shouldPlaySFX()) {
      // Calculate pan based on position relative to camera view
      // Pan range: -1 (left) to +1 (right)
      const viewCenterX = cameraX + screenWidth / 2;
      const relativeX = x - viewCenterX;
      const maxDistance = screenWidth / 2;
      
      // Clamp pan to -1 to 1 range
      let pan = relativeX / maxDistance;
      pan = Math.max(-1, Math.min(1, pan));
      
      callback(pan);
    }
  }
  
  // Play music (if we had background music) if music is enabled
  static playMusic(callback) {
    if (this.shouldPlayMusic()) {
      callback();
    }
  }
  
  // Get the effective volume for music/sfx
  static getEffectiveVolume(type = 'sfx') {
    const masterVolume = this.getMasterVolume();
    
    if (type === 'music') {
      return this.isMusicEnabled() ? masterVolume : 0;
    } else {
      return this.isSFXEnabled() ? masterVolume : 0;
    }
  }
}
