import Phaser from 'phaser';
import { CONFIG } from './config.js';

export const SPRITE_SHEET_FRAME_WIDTH = 96;
export const SPRITE_SHEET_FRAME_HEIGHT = 96;
export const SPRITE_SHEET_FRAME_COUNT = 6;

export const UNIT_SPRITE_SHEETS = {
  'worker':      { walk: 'worker_walk.png',      attack: 'worker_attack.png' },
  'legionary':   { walk: 'legionary_walk.png',   attack: 'legionary_attack.png', frameWidth: 424, frameHeight: 416 },
  'pilum':       { walk: 'pilum_walk.png',        attack: 'pilum_attack.png' },
  'centurion':   { walk: 'centurion_walk.png',    attack: 'centurion_attack.png' },
  'scout':       { walk: 'scout_walk.png',        attack: 'scout_attack.png' },
  'harvester':   { walk: 'harvester_walk.png',    attack: 'harvester_attack.png' },
  'alien-scout': { walk: 'alien_scout_walk.png',  attack: 'alien_scout_attack.png' },
  'drone':       { walk: 'drone_walk.png',        attack: 'drone_attack.png' },
  'blaster':     { walk: 'blaster_walk.png',      attack: 'blaster_attack.png' },
  'overlord':    { walk: 'overlord_walk.png',     attack: 'overlord_attack.png' },
  'thrall':      { walk: 'thrall_walk.png',       attack: 'thrall_attack.png' },
  'berserker':   { walk: 'berserker_walk.png',    attack: 'berserker_attack.png' },
  'axeThrower':  { walk: 'axe_thrower_walk.png',  attack: 'axe_thrower_attack.png' },
  'jarl':        { walk: 'jarl_walk.png',         attack: 'jarl_attack.png' },
};

export class BaseGameScene extends Phaser.Scene {
  preloadGameAssets() {
    this.load.on('loaderror', (file) => {
      console.warn(`Asset failed to load: ${file.key} (${file.url})`);
    });

    this.load.image('sky', 'https://rosebud.ai/assets/purple-sky-background.webp?764C');
    this.load.image('mountains', 'https://rosebud.ai/assets/mountains-layer.webp?hr6l');
    this.load.image('ground', 'https://rosebud.ai/assets/ground-terrain.webp?y66d');

    this.load.image('player-castle', 'https://rosebud.ai/assets/player-castle.webp?v688');
    this.load.image('alien-base', 'https://rosebud.ai/assets/alien-base.webp?YyOt');
    this.load.image('viking-base', 'https://rosebud.ai/assets/viking-base.webp?TXvW');

    this.load.image('worker', 'https://rosebud.ai/assets/worker-unit.webp?J01Z');
    this.load.image('legionary', 'https://rosebud.ai/assets/legionary-unit.webp?qjIO');
    this.load.image('pilum', 'https://rosebud.ai/assets/pilum-thrower-unit.webp?T3tA');
    this.load.image('centurion', 'https://rosebud.ai/assets/centurion-unit.webp?DAva');
    this.load.image('scout', 'https://rosebud.ai/assets/scout-unit.webp?YOqf');

    this.load.image('harvester', 'https://rosebud.ai/assets/harvester-unit.webp?Rn3x');
    this.load.image('alien-scout', 'https://rosebud.ai/assets/alien-scout-unit.webp?fkPM');
    this.load.image('drone', 'https://rosebud.ai/assets/drone-unit.webp?15fr');
    this.load.image('blaster', 'https://rosebud.ai/assets/blaster-unit.webp?jDED');
    this.load.image('overlord', 'https://rosebud.ai/assets/overlord-unit.webp?htbf');

    this.load.image('thrall', 'https://rosebud.ai/assets/thrall-unit.webp?KkBj');
    this.load.image('berserker', 'https://rosebud.ai/assets/berserker-unit.webp?J07Q');
    this.load.image('axeThrower', 'https://rosebud.ai/assets/axe-thrower-unit.webp?IyG2');
    this.load.image('jarl', 'https://rosebud.ai/assets/jarl-unit.webp?QY82');

    this.load.image('gold-mine', 'https://rosebud.ai/assets/gold-mine.webp?zSoi');
    this.load.image('alien-mine', 'https://rosebud.ai/assets/alien-mine.webp?qbWt');
    this.load.image('viking-mine', 'https://rosebud.ai/assets/viking-mine.webp?SnGW');

    this._loadSpriteSheetsIfAvailable();
  }

  _loadSpriteSheetsIfAvailable() {
    const defaultFrameConfig = {
      frameWidth: SPRITE_SHEET_FRAME_WIDTH,
      frameHeight: SPRITE_SHEET_FRAME_HEIGHT,
    };

    Object.entries(UNIT_SPRITE_SHEETS).forEach(([key, files]) => {
      const frameConfig = (files.frameWidth && files.frameHeight)
        ? { frameWidth: files.frameWidth, frameHeight: files.frameHeight }
        : defaultFrameConfig;

      const walkKey = `${key}_walk`;
      const attackKey = `${key}_attack`;

      if (this.textures.exists(walkKey)) {
        const tex = this.textures.get(walkKey);
        const firstFrame = tex.frames['0'];
        if (!firstFrame || firstFrame.realWidth !== frameConfig.frameWidth) {
          this.textures.remove(walkKey);
          if (this.anims.exists(walkKey)) this.anims.remove(walkKey);
        }
      }
      if (this.textures.exists(attackKey)) {
        const tex = this.textures.get(attackKey);
        const firstFrame = tex.frames['0'];
        if (!firstFrame || firstFrame.realWidth !== frameConfig.frameWidth) {
          this.textures.remove(attackKey);
          if (this.anims.exists(attackKey)) this.anims.remove(attackKey);
        }
      }

      this.load.spritesheet(walkKey, files.walk, frameConfig);
      this.load.spritesheet(attackKey, files.attack, frameConfig);
    });
  }

  createUnitAnimations() {
    Object.keys(UNIT_SPRITE_SHEETS).forEach((key) => {
      const walkKey = `${key}_walk`;
      const attackKey = `${key}_attack`;

      if (this.textures.exists(walkKey) && !this.anims.exists(walkKey)) {
        this.anims.create({
          key: walkKey,
          frames: this.anims.generateFrameNumbers(walkKey, { start: 0, end: SPRITE_SHEET_FRAME_COUNT - 1 }),
          frameRate: 10,
          repeat: -1,
        });
      }

      if (this.textures.exists(attackKey) && !this.anims.exists(attackKey)) {
        this.anims.create({
          key: attackKey,
          frames: this.anims.generateFrameNumbers(attackKey, { start: 0, end: SPRITE_SHEET_FRAME_COUNT - 1 }),
          frameRate: 12,
          repeat: 0,
        });
      }
    });
  }

  createBackground() {
    const { width, height } = this.scale;
    const groundY = this.groundY || height * 0.75;

    const sky = this.add.image(CONFIG.WORLD_WIDTH / 2, height / 2, 'sky');
    sky.setDisplaySize(CONFIG.WORLD_WIDTH, height);
    sky.setScrollFactor(0);
    sky.setDepth(-3);

    const mountains = this.add.image(CONFIG.WORLD_WIDTH / 2, height / 2, 'mountains');
    mountains.setDisplaySize(CONFIG.WORLD_WIDTH, height);
    mountains.setScrollFactor(0.3);
    mountains.setDepth(-2);

    const ground = this.add.image(CONFIG.WORLD_WIDTH / 2, groundY + 200, 'ground');
    ground.setDisplaySize(CONFIG.WORLD_WIDTH, height * 0.5);
    ground.setScrollFactor(1);
    ground.setDepth(-1);
  }
}
