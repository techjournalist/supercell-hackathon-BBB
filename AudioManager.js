export class AudioManager {
  static _cache = {
    musicEnabled: null,
    sfxEnabled: null,
    masterVolume: null,
    musicVolume: null,
    sfxVolume: null,
  };

  static _invalidate() {
    this._cache.musicEnabled = null;
    this._cache.sfxEnabled = null;
    this._cache.masterVolume = null;
    this._cache.musicVolume = null;
    this._cache.sfxVolume = null;
  }

  static isMusicEnabled() {
    if (this._cache.musicEnabled === null) {
      this._cache.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
    }
    return this._cache.musicEnabled;
  }

  static isSFXEnabled() {
    if (this._cache.sfxEnabled === null) {
      this._cache.sfxEnabled = localStorage.getItem('sfxEnabled') !== 'false';
    }
    return this._cache.sfxEnabled;
  }

  static getMasterVolume() {
    if (this._cache.masterVolume === null) {
      this._cache.masterVolume = parseFloat(localStorage.getItem('gameVolume') || '0.7');
    }
    return this._cache.masterVolume;
  }

  static getMusicVolume() {
    if (this._cache.musicVolume === null) {
      this._cache.musicVolume = parseFloat(localStorage.getItem('musicVolume') || String(this.getMasterVolume()));
    }
    return this._cache.musicVolume;
  }

  static getSFXVolume() {
    if (this._cache.sfxVolume === null) {
      this._cache.sfxVolume = parseFloat(localStorage.getItem('sfxVolume') || String(this.getMasterVolume()));
    }
    return this._cache.sfxVolume;
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
    this._invalidate();
  }

  static toggleMute(type) {
    if (type === 'music') {
      const current = this.isMusicEnabled();
      localStorage.setItem('musicEnabled', current ? 'false' : 'true');
    } else if (type === 'sfx') {
      const current = this.isSFXEnabled();
      localStorage.setItem('sfxEnabled', current ? 'false' : 'true');
    }
    this._invalidate();
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
