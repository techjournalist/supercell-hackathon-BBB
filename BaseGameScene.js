import Phaser from 'phaser';
import { CONFIG } from './config.js';

export const SPRITE_SHEET_FRAME_WIDTH = 96;
export const SPRITE_SHEET_FRAME_HEIGHT = 96;
export const SPRITE_SHEET_FRAME_COUNT = 6;

export const UNIT_SPRITE_SHEETS = {};

export class BaseGameScene extends Phaser.Scene {
  preloadGameAssets() {
    this.load.on('loaderror', (file) => {

    });

    this.load.image('sky', 'https://rosebud.ai/assets/purple-sky-background.webp?764C');
    this.load.image('mountains', 'https://rosebud.ai/assets/mountains-layer.webp?hr6l');
    this.load.image('ground', 'https://rosebud.ai/assets/ground-terrain.webp?y66d');

    this.load.image('player-castle', 'https://rosebud.ai/assets/player-castle.webp?v688');
    this.load.image('alien-base', 'https://rosebud.ai/assets/alien-base.webp?YyOt');

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

    this.load.image('gold-mine', 'https://rosebud.ai/assets/gold-mine.webp?zSoi');
    this.load.image('alien-mine', 'https://rosebud.ai/assets/alien-mine.webp?qbWt');

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

  generateVikingTextures() {
    const g = this.add.graphics();

    const draw = (key, fn) => {
      if (this.textures.exists(key)) return;
      g.clear();
      fn(g);
      g.generateTexture(key, 128, 128);
    };

    // Thrall - hunched worker, brown rags, small
    draw('thrall', (g) => {
      // Shadow
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(64, 112, 48, 14);
      // Legs
      g.fillStyle(0x5C3A1E);
      g.fillRect(52, 88, 10, 24);
      g.fillRect(66, 88, 10, 24);
      // Body/tunic
      g.fillStyle(0x8B6540);
      g.fillRect(46, 56, 36, 36);
      // Belt
      g.fillStyle(0x3D2B1F);
      g.fillRect(46, 84, 36, 6);
      // Arms
      g.fillStyle(0x8B6540);
      g.fillRect(34, 58, 12, 26);
      g.fillRect(82, 58, 12, 26);
      // Hands with tools
      g.fillStyle(0xC8956A);
      g.fillRect(34, 82, 10, 8);
      g.fillRect(84, 82, 10, 8);
      // Pickaxe
      g.fillStyle(0x888888);
      g.fillRect(90, 72, 4, 20);
      g.fillRect(84, 68, 16, 6);
      // Head
      g.fillStyle(0xC8956A);
      g.fillCircle(64, 44, 18);
      // Hair (dark)
      g.fillStyle(0x3D2B1F);
      g.fillRect(46, 30, 36, 16);
      // Eyes
      g.fillStyle(0x2C1810);
      g.fillRect(58, 40, 5, 5);
      g.fillRect(69, 40, 5, 5);
      // Beard stubble
      g.fillStyle(0x5C3A1E);
      g.fillRect(56, 50, 16, 6);
    });

    // Berserker - muscular warrior, fur armor, axe
    draw('berserker', (g) => {
      // Shadow
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(64, 114, 52, 14);
      // Legs with fur boots
      g.fillStyle(0x4A3728);
      g.fillRect(48, 84, 14, 30);
      g.fillRect(66, 84, 14, 30);
      // Fur boot tops
      g.fillStyle(0x8B7355);
      g.fillRect(46, 84, 18, 8);
      g.fillRect(64, 84, 18, 8);
      // Body - fur vest
      g.fillStyle(0x8B7355);
      g.fillRect(40, 44, 48, 44);
      // Chest straps
      g.fillStyle(0x5C3A1E);
      g.fillRect(60, 44, 8, 44);
      g.fillRect(40, 64, 48, 6);
      // Left arm (shield side)
      g.fillStyle(0xC8956A);
      g.fillRect(22, 46, 18, 32);
      // Shield
      g.fillStyle(0x8B4513);
      g.fillRect(6, 40, 22, 38);
      g.fillStyle(0xFFD700);
      g.fillRect(8, 42, 18, 34);
      g.fillStyle(0x8B4513);
      g.fillCircle(17, 59, 8);
      g.fillStyle(0xFFD700);
      g.fillCircle(17, 59, 4);
      // Right arm (axe side)
      g.fillStyle(0xC8956A);
      g.fillRect(86, 42, 18, 34);
      // Axe handle
      g.fillStyle(0x5C3A1E);
      g.fillRect(100, 30, 8, 46);
      // Axe head
      g.fillStyle(0x999999);
      g.fillTriangle(108, 28, 122, 18, 122, 50);
      g.fillStyle(0xCCCCCC);
      g.fillTriangle(110, 32, 122, 22, 122, 46);
      // Head
      g.fillStyle(0xC8956A);
      g.fillCircle(64, 30, 22);
      // Viking helmet
      g.fillStyle(0x888888);
      g.fillRect(42, 14, 44, 20);
      g.fillRect(40, 14, 8, 28);
      g.fillRect(80, 14, 8, 28);
      // Horns
      g.fillStyle(0xF5DEB3);
      g.fillTriangle(40, 14, 28, -4, 44, 18);
      g.fillTriangle(88, 14, 100, -4, 84, 18);
      // Face
      g.fillStyle(0xC8956A);
      g.fillRect(48, 22, 32, 24);
      // Eyes - fierce
      g.fillStyle(0x1A0A00);
      g.fillRect(53, 26, 7, 6);
      g.fillRect(68, 26, 7, 6);
      // Beard
      g.fillStyle(0x8B4513);
      g.fillRect(48, 40, 32, 14);
      // Beard braids
      g.fillRect(52, 52, 8, 10);
      g.fillRect(68, 52, 8, 10);
    });

    // Axe Thrower - lean ranger, two small axes
    draw('axeThrower', (g) => {
      // Shadow
      g.fillStyle(0x000000, 0.2);
      g.fillEllipse(64, 114, 44, 12);
      // Legs
      g.fillStyle(0x4A3728);
      g.fillRect(50, 82, 12, 32);
      g.fillRect(66, 82, 12, 32);
      // Body - leather armor
      g.fillStyle(0x6B4C2A);
      g.fillRect(44, 44, 40, 42);
      // Armor plates
      g.fillStyle(0x8B6540);
      g.fillRect(44, 44, 40, 14);
      g.fillRect(46, 60, 36, 4);
      g.fillRect(46, 70, 36, 4);
      // Left arm
      g.fillStyle(0xC8956A);
      g.fillRect(28, 46, 16, 28);
      // Right arm raised
      g.fillStyle(0xC8956A);
      g.fillRect(84, 36, 16, 28);
      // Axe in right hand
      g.fillStyle(0x5C3A1E);
      g.fillRect(96, 20, 6, 28);
      g.fillStyle(0xAAAAAA);
      g.fillTriangle(102, 18, 116, 12, 114, 32);
      g.fillTriangle(102, 22, 114, 32, 98, 36);
      // Belt with axes
      g.fillStyle(0x3D2B1F);
      g.fillRect(44, 78, 40, 8);
      // Small axe on belt
      g.fillStyle(0xAAAAAA);
      g.fillRect(54, 76, 4, 12);
      g.fillRect(50, 73, 12, 5);
      // Head
      g.fillStyle(0xC8956A);
      g.fillCircle(64, 30, 18);
      // Leather hood
      g.fillStyle(0x5C3A1E);
      g.fillRect(46, 16, 36, 18);
      g.fillRect(44, 22, 8, 14);
      g.fillRect(80, 22, 8, 14);
      // Eyes
      g.fillStyle(0x1A0A00);
      g.fillRect(57, 27, 5, 5);
      g.fillRect(68, 27, 5, 5);
      // Beard - short
      g.fillStyle(0x8B4513);
      g.fillRect(56, 40, 16, 8);
    });

    // Jarl - massive commander, ornate armor
    draw('jarl', (g) => {
      // Shadow
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(64, 116, 68, 18);
      // Legs - armored greaves
      g.fillStyle(0x555555);
      g.fillRect(44, 80, 16, 36);
      g.fillRect(68, 80, 16, 36);
      // Knee guards
      g.fillStyle(0x888888);
      g.fillRect(42, 80, 20, 10);
      g.fillRect(66, 80, 20, 10);
      // Body - plate armor
      g.fillStyle(0x666666);
      g.fillRect(34, 38, 60, 46);
      // Breastplate detail
      g.fillStyle(0x999999);
      g.fillRect(38, 42, 52, 38);
      // Gold trim on armor
      g.fillStyle(0xFFD700);
      g.fillRect(36, 38, 56, 6);
      g.fillRect(36, 78, 56, 6);
      g.fillRect(36, 38, 6, 46);
      g.fillRect(86, 38, 6, 46);
      // Rune etching
      g.fillStyle(0x4488CC);
      g.fillRect(58, 50, 12, 20);
      g.fillRect(54, 58, 20, 4);
      // Left arm - huge shield
      g.fillStyle(0x444444);
      g.fillRect(16, 36, 18, 42);
      g.fillStyle(0x2244AA);
      g.fillRect(4, 28, 24, 56);
      g.fillStyle(0xFFD700);
      g.fillRect(6, 30, 20, 52);
      g.fillStyle(0x2244AA);
      g.fillEllipse(16, 56, 16, 40);
      g.fillStyle(0xFFD700);
      g.fillCircle(16, 56, 6);
      g.fillStyle(0xCC0000);
      g.fillCircle(16, 56, 3);
      // Right arm - war axe
      g.fillStyle(0x444444);
      g.fillRect(94, 32, 18, 42);
      // Axe handle - thick
      g.fillStyle(0x3D2B1F);
      g.fillRect(106, 4, 10, 66);
      // Axe head - large double-bit
      g.fillStyle(0x888888);
      g.fillTriangle(116, 2, 128, -8, 128, 30);
      g.fillTriangle(116, 10, 128, -2, 128, 34);
      g.fillStyle(0xCCCCCC);
      g.fillTriangle(116, 6, 126, -4, 126, 30);
      g.fillRect(116, 2, 4, 10);
      // Head - large with crown helm
      g.fillStyle(0xC8956A);
      g.fillCircle(64, 24, 24);
      // Crown helmet
      g.fillStyle(0x888888);
      g.fillRect(40, 8, 48, 22);
      // Crown spikes
      g.fillStyle(0x999999);
      g.fillTriangle(40, 8, 44, -6, 48, 8);
      g.fillTriangle(54, 8, 58, -10, 62, 8);
      g.fillTriangle(66, 8, 70, -10, 74, 8);
      g.fillTriangle(80, 8, 84, -6, 88, 8);
      // Gold crown band
      g.fillStyle(0xFFD700);
      g.fillRect(40, 18, 48, 8);
      // Gems on crown
      g.fillStyle(0xCC0000);
      g.fillCircle(52, 22, 4);
      g.fillCircle(64, 22, 4);
      g.fillCircle(76, 22, 4);
      // Face
      g.fillStyle(0xC8956A);
      g.fillRect(46, 18, 36, 26);
      // Stern eyes
      g.fillStyle(0x1A0A00);
      g.fillRect(51, 22, 8, 6);
      g.fillRect(69, 22, 8, 6);
      // Thick beard
      g.fillStyle(0xB8860B);
      g.fillRect(44, 36, 40, 16);
      g.fillRect(48, 50, 32, 12);
      // Beard braid
      g.fillRect(56, 60, 16, 18);
      g.fillStyle(0xFFD700);
      g.fillCircle(64, 80, 4);
      // Fur collar
      g.fillStyle(0xDEB887);
      g.fillRect(34, 38, 60, 12);
    });

    // Viking base - longhouse with shields
    draw('viking-base', (g) => {
      // Ground shadow
      g.fillStyle(0x000000, 0.3);
      g.fillEllipse(64, 122, 110, 20);
      // Main longhouse body
      g.fillStyle(0x5C3A1E);
      g.fillRect(8, 60, 112, 56);
      // Wood planks detail
      g.fillStyle(0x4A2E16);
      for (let y = 64; y < 116; y += 8) {
        g.fillRect(8, y, 112, 2);
      }
      // Roof - steep A-frame
      g.fillStyle(0x8B4513);
      g.fillTriangle(64, 4, 0, 62, 128, 62);
      // Roof shingles
      g.fillStyle(0x6B3410);
      for (let i = 0; i < 8; i++) {
        g.fillRect(i * 16, 30 + i * 4, 14, 3);
        g.fillRect(112 - i * 16, 30 + i * 4, 14, 3);
      }
      // Ridge beam
      g.fillStyle(0x3D2B1F);
      g.fillRect(60, 4, 8, 58);
      // Dragon head at peak
      g.fillStyle(0xCC4400);
      g.fillCircle(64, 6, 8);
      g.fillTriangle(64, 0, 72, -8, 76, 2);
      g.fillStyle(0xFFAA00);
      g.fillCircle(61, 4, 2);
      g.fillCircle(67, 4, 2);
      // Door
      g.fillStyle(0x2C1810);
      g.fillRect(50, 78, 28, 38);
      g.fillStyle(0x3D2B1F);
      g.fillRect(52, 80, 24, 36);
      // Door iron reinforcement
      g.fillStyle(0x555555);
      g.fillRect(62, 80, 4, 36);
      g.fillRect(52, 94, 24, 4);
      // Shield decorations on wall
      g.fillStyle(0xCC2222);
      g.fillCircle(24, 80, 12);
      g.fillStyle(0xFFD700);
      g.fillCircle(24, 80, 8);
      g.fillStyle(0xCC2222);
      g.fillCircle(24, 80, 4);
      g.fillStyle(0xCC2222);
      g.fillCircle(104, 80, 12);
      g.fillStyle(0xFFD700);
      g.fillCircle(104, 80, 8);
      g.fillStyle(0xCC2222);
      g.fillCircle(104, 80, 4);
      // Torches
      g.fillStyle(0x5C3A1E);
      g.fillRect(40, 68, 4, 20);
      g.fillRect(84, 68, 4, 20);
      g.fillStyle(0xFF6600);
      g.fillCircle(42, 66, 5);
      g.fillCircle(86, 66, 5);
      g.fillStyle(0xFFFF00);
      g.fillCircle(42, 64, 3);
      g.fillCircle(86, 64, 3);
    });

    // Viking mine - runic stone with gold veins
    draw('viking-mine', (g) => {
      // Ground shadow
      g.fillStyle(0x000000, 0.25);
      g.fillEllipse(64, 118, 80, 16);
      // Stone base
      g.fillStyle(0x888888);
      g.fillRect(20, 60, 88, 56);
      // Stone texture
      g.fillStyle(0x777777);
      g.fillRect(20, 60, 88, 6);
      g.fillRect(20, 72, 88, 4);
      g.fillRect(20, 84, 88, 4);
      g.fillRect(20, 96, 88, 4);
      // Gold veins
      g.fillStyle(0xFFD700);
      g.fillRect(32, 64, 4, 48);
      g.fillRect(44, 68, 3, 40);
      g.fillRect(60, 72, 5, 32);
      g.fillRect(78, 66, 4, 46);
      // Gold nuggets
      g.fillStyle(0xFFAA00);
      g.fillCircle(36, 72, 6);
      g.fillCircle(62, 80, 8);
      g.fillCircle(80, 90, 6);
      g.fillStyle(0xFFFF00);
      g.fillCircle(36, 72, 3);
      g.fillCircle(62, 80, 4);
      // Runic stone pillar
      g.fillStyle(0x999999);
      g.fillRect(46, 20, 36, 44);
      // Runes carved in
      g.fillStyle(0xFFD700);
      g.fillRect(56, 26, 4, 14);
      g.fillRect(52, 30, 12, 3);
      g.fillRect(64, 40, 4, 14);
      g.fillRect(60, 44, 12, 3);
      // Stone cap
      g.fillStyle(0xAAAAAA);
      g.fillRect(42, 16, 44, 10);
      // Pickaxe leaning against stone
      g.fillStyle(0x5C3A1E);
      g.fillRect(96, 38, 6, 56);
      g.fillStyle(0xAAAAAA);
      g.fillRect(90, 34, 20, 8);
      g.fillStyle(0x888888);
      g.fillTriangle(110, 34, 118, 26, 118, 42);
    });

    g.destroy();
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
