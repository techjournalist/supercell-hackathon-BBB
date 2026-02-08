// Web Audio API Sound System - Procedural sound generation
export class AudioSystem {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.volume = 0.3;
    this.enabled = true;
    
    this.init();
  }
  
  init() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = this.volume;
      this.masterGain.connect(this.audioContext.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
      this.enabled = false;
    }
  }
  
  // Sword clang - metallic impact
  playSwordClang() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.exponentialRampToValueAtTime(100, now + 0.1);
    
    filter.type = 'highpass';
    filter.frequency.value = 500;
    
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.15);
  }
  
  // Laser zap - sci-fi weapon
  playLaserZap() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(1200, now);
    oscillator.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }
  
  // Axe thud - heavy impact
  playAxeThud() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(120, now);
    oscillator.frequency.exponentialRampToValueAtTime(40, now + 0.2);
    
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
  }
  
  // UI click - button press
  playUIClick() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, now);
    oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.05);
  }
  
  // Spell cast whoosh
  playSpellCast() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(400, now);
    oscillator.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
    
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 5;
    
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
  
  // Victory fanfare
  playVictoryFanfare() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, i) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.value = freq;
      
      const startTime = now + (i * 0.15);
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      oscillator.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
  }
  
  // Defeat drums
  playDefeatDrums() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const beats = [0, 0.25, 0.5, 0.75];
    
    beats.forEach((beat) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filter = this.audioContext.createBiquadFilter();
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(80, now + beat);
      oscillator.frequency.exponentialRampToValueAtTime(40, now + beat + 0.1);
      
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      
      gainNode.gain.setValueAtTime(0.5, now + beat);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + beat + 0.2);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      oscillator.start(now + beat);
      oscillator.stop(now + beat + 0.2);
    });
  }
  
  // Explosion/death
  playExplosion() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const noise = this.audioContext.createBufferSource();
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    noise.buffer = buffer;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    noise.start(now);
    noise.stop(now + 0.3);
  }
  
  // Coin/gold collection
  playGoldCollect() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.setValueAtTime(1200, now + 0.05);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.1);
  }
  
  // Warning beep - urgent alert sound
  playWarningBeep() {
    if (!this.enabled) return;
    
    const now = this.audioContext.currentTime;
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(800, now);
    oscillator.frequency.setValueAtTime(1000, now + 0.1);
    oscillator.frequency.setValueAtTime(800, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.setValueAtTime(0, now + 0.05);
    gainNode.gain.setValueAtTime(0.2, now + 0.1);
    gainNode.gain.setValueAtTime(0, now + 0.15);
    gainNode.gain.setValueAtTime(0.2, now + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    oscillator.start(now);
    oscillator.stop(now + 0.3);
  }
  
  // Play sound based on faction
  playFactionAttack(factionId) {
    switch(factionId) {
      case 'roman':
        this.playSwordClang();
        break;
      case 'alien':
        this.playLaserZap();
        break;
      case 'viking':
        this.playAxeThud();
        break;
    }
  }
  
  setVolume(vol) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain) {
      this.masterGain.gain.value = this.volume;
    }
  }
  
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  
  cleanup() {
    // Disconnect and clean up audio nodes
    if (this.masterGain) {
      this.masterGain.disconnect();
    }
    
    // Note: We don't close the audio context as it may be shared
    // or needed for other scenes. Phaser will handle final cleanup.
  }
}
