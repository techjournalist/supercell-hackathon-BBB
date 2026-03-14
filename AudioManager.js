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

  static getMusicVolume() {
    return parseFloat(localStorage.getItem('musicVolume') || String(this.getMasterVolume()));
  }

  static getSFXVolume() {
    return parseFloat(localStorage.getItem('sfxVolume') || String(this.getMasterVolume()));
  }

  static shouldPlayMusic() {
    return this.isMusicEnabled() && this.getMasterVolume() > 0;
  }

  static shouldPlaySFX() {
    return this.isSFXEnabled() && this.getMasterVolume() > 0;
  }

  static setVolume(type, value) {
    const clamped = Math.max(0, Math.min(1, value));
    if (type === 'music') {
      localStorage.setItem('musicVolume', String(clamped));
      localStorage.setItem('gameVolume', String(clamped));
    } else if (type === 'sfx') {
      localStorage.setItem('sfxVolume', String(clamped));
    }
  }

  static toggleMute(type) {
    if (type === 'music') {
      const current = this.isMusicEnabled();
      localStorage.setItem('musicEnabled', current ? 'false' : 'true');
    } else if (type === 'sfx') {
      const current = this.isSFXEnabled();
      localStorage.setItem('sfxEnabled', current ? 'false' : 'true');
    }
  }

  static get volumes() {
    return {
      music: this.getMusicVolume(),
      sfx: this.getSFXVolume(),
    };
  }

  static get muted() {
    return {
      music: !this.isMusicEnabled(),
      sfx: !this.isSFXEnabled(),
    };
  }

  static playSFX(callback) {
    if (this.shouldPlaySFX()) {
      callback();
    }
  }

  static playPositionalSFX(callback, x, cameraX, screenWidth, worldWidth) {
    if (this.shouldPlaySFX()) {
      const viewCenterX = cameraX + screenWidth / 2;
      const relativeX = x - viewCenterX;
      const maxDistance = screenWidth / 2;
      let pan = relativeX / maxDistance;
      pan = Math.max(-1, Math.min(1, pan));
      callback(pan);
    }
  }

  static playMusic(callback) {
    if (this.shouldPlayMusic()) {
      callback();
    }
  }

  static getEffectiveVolume(type = 'sfx') {
    const masterVolume = this.getMasterVolume();
    if (type === 'music') {
      return this.isMusicEnabled() ? masterVolume : 0;
    } else {
      return this.isSFXEnabled() ? masterVolume : 0;
    }
  }
}
