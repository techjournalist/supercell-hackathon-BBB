import Phaser from 'phaser';
import { CONFIG } from './config.js';

export class Minimap extends Phaser.GameObjects.Container {
  constructor(scene, x, y, width, height) {
    super(scene, x, y);
    
    this.scene = scene;
    this.minimapWidth = width;
    this.minimapHeight = height;
    
    // Background
    this.bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.6);
    this.bg.setStrokeStyle(2, 0x444444);
    
    // Camera viewport indicator (white rectangle)
    this.viewportRect = scene.add.rectangle(0, 0, 100, height - 4, 0xffffff, 0);
    this.viewportRect.setStrokeStyle(2, 0xffffff);
    
    // Base icons container
    this.baseIconsContainer = scene.add.container(0, 0);
    
    // Player base icon (left side) - white dot
    const playerBaseX = this.worldToMinimapX(CONFIG.PLAYER_BASE_X);
    this.playerBaseIcon = scene.add.circle(playerBaseX, 0, 5, 0xFFFFFF);
    this.playerBaseIcon.setStrokeStyle(1, 0x000000);
    
    // Enemy base icon (right side) - red dot
    const enemyBaseX = this.worldToMinimapX(CONFIG.ENEMY_BASE_X);
    this.enemyBaseIcon = scene.add.circle(enemyBaseX, 0, 5, 0xFF0000);
    this.enemyBaseIcon.setStrokeStyle(1, 0x000000);
    
    this.baseIconsContainer.add([this.playerBaseIcon, this.enemyBaseIcon]);
    
    // Unit dots container (updated each frame)
    this.unitsContainer = scene.add.container(0, 0);
    
    // Object pool for unit dots - reuse instead of destroy/create
    this.dotPool = {
      player: [],
      enemy: [],
    };
    
    // Pre-allocate dot objects
    const maxDots = 50; // Reasonable max units per side
    for (let i = 0; i < maxDots; i++) {
      const playerDot = scene.add.circle(0, 0, 3, 0x2196F3);
      playerDot.setStrokeStyle(1, 0x000000);
      playerDot.setVisible(false);
      this.unitsContainer.add(playerDot);
      this.dotPool.player.push(playerDot);
      
      const enemyDot = scene.add.circle(0, 0, 3, 0xF44336);
      enemyDot.setStrokeStyle(1, 0x000000);
      enemyDot.setVisible(false);
      this.unitsContainer.add(enemyDot);
      this.dotPool.enemy.push(enemyDot);
    }
    
    // Add all to container
    this.add([this.bg, this.baseIconsContainer, this.unitsContainer, this.viewportRect]);
    
    // Set to fixed position (doesn't scroll)
    this.setScrollFactor(0);
    this.setDepth(90);
    
    scene.add.existing(this);
    
    // Make minimap clickable for camera jumping
    this.bg.setInteractive();
    this.bg.on('pointerdown', (pointer) => {
      const localX = pointer.x - (this.x - this.minimapWidth / 2);
      const worldX = (localX / this.minimapWidth) * CONFIG.WORLD_WIDTH;
      
      // Center camera on clicked position
      scene.cameras.main.scrollX = Phaser.Math.Clamp(
        worldX - scene.scale.width / 2,
        0,
        CONFIG.WORLD_WIDTH - scene.scale.width
      );
    });
  }
  
  worldToMinimapX(worldX) {
    // Convert world X coordinate to minimap X coordinate
    const percent = worldX / CONFIG.WORLD_WIDTH;
    return (percent - 0.5) * this.minimapWidth;
  }
  
  update() {
    // Hide all dots first
    this.dotPool.player.forEach(dot => dot.setVisible(false));
    this.dotPool.enemy.forEach(dot => dot.setVisible(false));
    
    // Update player unit dots (reuse from pool)
    let playerIndex = 0;
    this.scene.playerUnits.forEach(unit => {
      if (unit.isDead || playerIndex >= this.dotPool.player.length) return;
      
      const dot = this.dotPool.player[playerIndex];
      const minimapX = this.worldToMinimapX(unit.x);
      dot.x = minimapX;
      dot.setVisible(true);
      playerIndex++;
    });
    
    // Update enemy unit dots (reuse from pool)
    let enemyIndex = 0;
    this.scene.enemyUnits.forEach(unit => {
      if (unit.isDead || enemyIndex >= this.dotPool.enemy.length) return;
      
      const dot = this.dotPool.enemy[enemyIndex];
      const minimapX = this.worldToMinimapX(unit.x);
      dot.x = minimapX;
      dot.setVisible(true);
      enemyIndex++;
    });
    
    // Update camera viewport indicator
    const camera = this.scene.cameras.main;
    const viewportStartWorld = camera.scrollX;
    const viewportEndWorld = camera.scrollX + this.scene.scale.width;
    
    const viewportStartMinimap = this.worldToMinimapX(viewportStartWorld);
    const viewportEndMinimap = this.worldToMinimapX(viewportEndWorld);
    const viewportWidth = viewportEndMinimap - viewportStartMinimap;
    const viewportCenter = (viewportStartMinimap + viewportEndMinimap) / 2;
    
    this.viewportRect.x = viewportCenter;
    this.viewportRect.width = viewportWidth;
    
    // Update base health indicators (change color as damaged)
    if (this.scene.playerBase) {
      const playerHealthPercent = this.scene.playerBase.health / this.scene.playerBase.maxHealth;
      if (playerHealthPercent < 0.3) {
        this.playerBaseIcon.setFillStyle(0xFF0000);
      } else if (playerHealthPercent < 0.6) {
        this.playerBaseIcon.setFillStyle(0xFFA500);
      }
    }
    
    if (this.scene.enemyBase) {
      const enemyHealthPercent = this.scene.enemyBase.health / this.scene.enemyBase.maxHealth;
      if (enemyHealthPercent < 0.3) {
        this.enemyBaseIcon.setFillStyle(0xFF0000);
      } else if (enemyHealthPercent < 0.6) {
        this.enemyBaseIcon.setFillStyle(0xFF6347);
      }
    }
  }
}
