import Phaser from 'phaser';
import { CONFIG } from './config.js';

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
