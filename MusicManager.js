const TRACKS = {
  'menu-theme':        '/audio/menu-theme.mp3',
  'roman-music':       '/audio/roman-theme.mp3',
  'viking-music':      '/audio/viking-background.mp3',
  'alien-music':       '/audio/alien-theme.mp3',
  'battle-music':      '/audio/battle-music-1.mp3',
};

let currentAudio = null;
let currentKey = null;
let pendingKey = null;
let volume = 0.7;
let enabled = true;
let unlocked = false;

function getVolume() {
  const v = parseFloat(localStorage.getItem('gameVolume') || '0.7');
  const musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
  return musicEnabled ? v : 0;
}

function tryUnlock() {
  if (unlocked) return;
  unlocked = true;
  if (pendingKey) {
    const k = pendingKey;
    pendingKey = null;
    play(k);
  }
}

document.addEventListener('click', tryUnlock, { once: false, capture: true });
document.addEventListener('touchstart', tryUnlock, { once: false, capture: true });
document.addEventListener('keydown', tryUnlock, { once: false, capture: true });

function play(key) {
  if (!key || !TRACKS[key]) return;

  const vol = getVolume();

  if (currentKey === key && currentAudio) {
    if (currentAudio.paused) {
      currentAudio.volume = vol;
      const p = currentAudio.play();
      if (p && p.catch) p.catch(() => { pendingKey = key; });
    }
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
    currentKey = null;
  }

  currentKey = key;
  const audio = new Audio(TRACKS[key]);
  audio.loop = true;
  audio.volume = vol;
  currentAudio = audio;

  const playPromise = audio.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch((err) => {
      if (err.name === 'NotAllowedError') {
        pendingKey = key;
        unlocked = false;
      }
    });
  }
}

function stop() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
    currentKey = null;
  }
  pendingKey = null;
}

function pause() {
  if (currentAudio && !currentAudio.paused) {
    currentAudio.pause();
  }
}

function resume() {
  if (currentAudio && currentAudio.paused) {
    const vol = getVolume();
    currentAudio.volume = vol;
    const p = currentAudio.play();
    if (p && p.catch) p.catch(() => { pendingKey = currentKey; });
  }
}

function setVolume(val) {
  volume = Math.max(0, Math.min(1, val));
  if (currentAudio) {
    currentAudio.volume = volume;
  }
}

function syncVolume() {
  const vol = getVolume();
  if (currentAudio) {
    currentAudio.volume = vol;
    if (vol === 0 && !currentAudio.paused) {
      currentAudio.pause();
    } else if (vol > 0 && currentAudio.paused && currentKey) {
      const p = currentAudio.play();
      if (p && p.catch) p.catch(() => {});
    }
  }
}

// Modulate music volume based on battle intensity (0-1)
// At intensity 0: base volume; at intensity 1: base + 30% boost
function applyBattleIntensity(intensity) {
  if (!currentAudio) return;
  const base = getVolume();
  if (base === 0) return;
  const boost = intensity * 0.3;
  const targetVol = Math.min(1, base + boost);
  currentAudio.volume = targetVol;
}

export const MusicManager = { play, stop, pause, resume, setVolume, syncVolume, tryUnlock, applyBattleIntensity };
