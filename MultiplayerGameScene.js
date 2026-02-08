import Phaser from 'phaser';
import * as Tone from 'tone';
import { CONFIG } from './config.js';
import { Unit } from './Unit.js';
import { Worker } from './Worker.js';
import { Harvester } from './Harvester.js';
import { Thrall } from './Thrall.js';
import { Base } from './Base.js';
import { GoldMine } from './GoldMine.js';

export class MultiplayerGameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerGameScene' });
  }
  
  preload() {
    // Load all assets (same as GameScene)
    this.load.image('sky', 'https://rosebud.ai/assets/purple-sky-background.webp?764C');
    this.load.image('mountains', 'https://rosebud.ai/assets/mountains-layer.webp?hr6l');
    this.load.image('ground', 'https://rosebud.ai/assets/ground-terrain.webp?y66d');
    
    this.load.image('player-castle', 'https://rosebud.ai/assets/player-castle.webp?v688');
    this.load.image('alien-base', 'https://rosebud.ai/assets/alien-base.webp?YyOt');
    this.load.image('viking-base', 'https://rosebud.ai/assets/viking-base.webp.webp?TXvW');
    
    this.load.image('worker', 'https://rosebud.ai/assets/worker-unit.webp?J01Z');
    this.load.image('legionary', 'https://rosebud.ai/assets/legionary-unit.webp?qjIO');
    this.load.image('pilum', 'https://rosebud.ai/assets/pilum-thrower-unit.webp?T3tA');
    this.load.image('centurion', 'https://rosebud.ai/assets/centurion-unit.webp?DAva');
    this.load.image('scout', 'https://rosebud.ai/assets/scout-unit.webp?YOqf');
    
    this.load.image('harvester', 'https://rosebud.ai/assets/harvester-unit.webp?Rn3x');
    this.load.image('alien-scout', 'https://rosebud.ai/assets/alien-scout-unit.webp.webp?fkPM');
    this.load.image('drone', 'https://rosebud.ai/assets/drone-unit.webp?15fr');
    this.load.image('blaster', 'https://rosebud.ai/assets/blaster-unit.webp?jDED');
    this.load.image('overlord', 'https://rosebud.ai/assets/overlord-unit.webp?htbf');
    
    this.load.image('thrall', 'https://rosebud.ai/assets/thrall-unit.webp.webp?KkBj');
    this.load.image('berserker', 'https://rosebud.ai/assets/berserker-unit.webp.webp?J07Q');
    this.load.image('axeThrower', 'https://rosebud.ai/assets/axe-thrower-unit.webp.webp?IyG2');
    this.load.image('jarl', 'https://rosebud.ai/assets/jarl-unit.webp.webp?QY82');
    
    this.load.image('gold-mine', 'https://rosebud.ai/assets/gold-mine.webp?zSoi');
    this.load.image('alien-mine', 'https://rosebud.ai/assets/alien-mine.webp?qbWt');
    this.load.image('viking-mine', 'https://rosebud.ai/assets/viking-mine.webp.webp?SnGW');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Get player factions
    this.player1Faction = this.registry.get('player1Faction');
    this.player2Faction = this.registry.get('player2Faction');
    
    // Calculate ground level and split
    this.groundY = height * 0.75;
    this.splitY = height / 2;
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);
    
    // Create shared background
    this.createBackground();
    
    // Create two cameras for split-screen
    this.createSplitScreenCameras();
    
    // Initialize player resources
    this.player1 = {
      gold: CONFIG.STARTING_GOLD,
      mana: CONFIG.STARTING_MANA,
      units: [],
      faction: this.player1Faction,
      cooldowns: {},
      spellCooldowns: { shieldWall: 0, rainOfPila: 0, healingSpring: 0, mindControl: 0, plasmaBomb: 0 }
    };
    
    this.player2 = {
      gold: CONFIG.STARTING_GOLD,
      mana: CONFIG.STARTING_MANA,
      units: [],
      faction: this.player2Faction,
      cooldowns: {},
      spellCooldowns: { shieldWall: 0, rainOfPila: 0, healingSpring: 0, mindControl: 0, plasmaBomb: 0 }
    };
    
    // Initialize cooldowns
    Object.keys(CONFIG.UNITS).forEach(key => {
      this.player1.cooldowns[key] = 0;
      this.player2.cooldowns[key] = 0;
    });
    
    Object.keys(CONFIG.ALIEN_UNITS).forEach(key => {
      this.player1.cooldowns[key] = 0;
      this.player2.cooldowns[key] = 0;
    });
    
    // Create bases
    this.createBases();
    
    // Create gold mines
    this.createGoldMines();
    
    // Create UI for both players
    this.createPlayer1UI();
    this.createPlayer2UI();
    
    // Setup controls
    this.setupControls();
    
    // Spawn initial units
    this.spawnInitialUnits();
    
    // Game state
    this.isGameOver = false;
    this.gameStartTime = this.time.now;
  }
  
  createBackground() {
    const { width, height } = this.scale;
    
    // Sky (parallax factor 0)
    const sky = this.add.image(CONFIG.WORLD_WIDTH / 2, height / 2, 'sky');
    sky.setDisplaySize(CONFIG.WORLD_WIDTH, height);
    sky.setScrollFactor(0);
    sky.setDepth(-3);
    
    // Mountains (parallax factor 0.3)
    const mountains = this.add.image(CONFIG.WORLD_WIDTH / 2, height / 2, 'mountains');
    mountains.setDisplaySize(CONFIG.WORLD_WIDTH, height);
    mountains.setScrollFactor(0.3);
    mountains.setDepth(-2);
    
    // Ground (parallax factor 1 - moves with camera)
    const ground = this.add.image(CONFIG.WORLD_WIDTH / 2, this.groundY + 200, 'ground');
    ground.setDisplaySize(CONFIG.WORLD_WIDTH, height * 0.5);
    ground.setScrollFactor(1);
    ground.setDepth(-1);
  }
  
  createSplitScreenCameras() {
    const { width, height } = this.scale;
    
    // Main camera for P1 (top half)
    this.cameras.main.setViewport(0, 0, width, height / 2);
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);
    this.cameras.main.scrollX = CONFIG.PLAYER_BASE_X - width / 4;
    this.player1Camera = this.cameras.main;
    
    // Second camera for P2 (bottom half)
    this.player2Camera = this.cameras.add(0, height / 2, width, height / 2);
    this.player2Camera.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);
    this.player2Camera.scrollX = CONFIG.ENEMY_BASE_X - width / 4;
    
    // Divider line between screens
    const divider = this.add.rectangle(0, height / 2, width, 4, 0xFFFFFF);
    divider.setOrigin(0, 0.5);
    divider.setScrollFactor(0);
    divider.setDepth(1000);
  }
  
  createBases() {
    const { height } = this.scale;
    
    // Player 1 base (left side)
    let p1BaseSprite = 'player-castle';
    if (this.player1Faction === 'alien') p1BaseSprite = 'alien-base';
    else if (this.player1Faction === 'viking') p1BaseSprite = 'viking-base';
    
    this.player1Base = new Base(
      this,
      CONFIG.PLAYER_BASE_X,
      this.groundY - 40,
      p1BaseSprite,
      false
    );
    
    // Player 2 base (right side)
    let p2BaseSprite = 'player-castle';
    if (this.player2Faction === 'alien') p2BaseSprite = 'alien-base';
    else if (this.player2Faction === 'viking') p2BaseSprite = 'viking-base';
    
    this.player2Base = new Base(
      this,
      CONFIG.ENEMY_BASE_X,
      this.groundY - 40,
      p2BaseSprite,
      true
    );
  }
  
  createGoldMines() {
    this.player1GoldMines = [];
    this.player2GoldMines = [];
    
    // P1 mines (left side)
    let p1MineSprite = 'gold-mine';
    if (this.player1Faction === 'alien') p1MineSprite = 'alien-mine';
    else if (this.player1Faction === 'viking') p1MineSprite = 'viking-mine';
    
    for (let i = 0; i < 2; i++) {
      const mineX = CONFIG.PLAYER_BASE_X + CONFIG.MINE_OFFSET_FROM_BASE + (i * 150);
      const mine = new GoldMine(this, mineX, this.groundY - 20, p1MineSprite);
      this.player1GoldMines.push(mine);
    }
    
    // P2 mines (right side)
    let p2MineSprite = 'gold-mine';
    if (this.player2Faction === 'alien') p2MineSprite = 'alien-mine';
    else if (this.player2Faction === 'viking') p2MineSprite = 'viking-mine';
    
    for (let i = 0; i < 2; i++) {
      const mineX = CONFIG.ENEMY_BASE_X - CONFIG.MINE_OFFSET_FROM_BASE - (i * 150);
      const mine = new GoldMine(this, mineX, this.groundY - 20, p2MineSprite);
      this.player2GoldMines.push(mine);
    }
  }
  
  createPlayer1UI() {
    const { width, height } = this.scale;
    const halfHeight = height / 2;
    const topMargin = 20;
    
    // Background bar
    const uiBg = this.add.rectangle(0, topMargin, width, 60, 0x1a1a1a, 0.9);
    uiBg.setOrigin(0, 0);
    uiBg.setScrollFactor(0);
    uiBg.setDepth(100);
    
    // Make it only visible in P1 camera
    this.player1Camera.ignore(this.getAllPlayer2UIElements());
    
    // Player label
    const label = this.add.text(20, topMargin + 10, 'PLAYER 1', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#4488FF',
    });
    label.setScrollFactor(0);
    label.setDepth(101);
    
    // Gold display
    const goldIcon = this.add.text(20, topMargin + 35, '💰', { fontSize: '16px' });
    goldIcon.setScrollFactor(0);
    goldIcon.setDepth(101);
    
    this.player1GoldText = this.add.text(45, topMargin + 38, '100', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    this.player1GoldText.setScrollFactor(0);
    this.player1GoldText.setDepth(101);
    
    // Mana display
    const manaIcon = this.add.text(140, topMargin + 35, '💎', { fontSize: '16px' });
    manaIcon.setScrollFactor(0);
    manaIcon.setDepth(101);
    
    this.player1ManaText = this.add.text(165, topMargin + 38, '50', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#00FFFF',
    });
    this.player1ManaText.setScrollFactor(0);
    this.player1ManaText.setDepth(101);
    
    // Unit training buttons (right side)
    this.createPlayerButtons(1, width - 500, topMargin + 30);
    
    // Store UI elements for camera
    this.player1UIElements = [uiBg, label, goldIcon, this.player1GoldText, manaIcon, this.player1ManaText];
  }
  
  createPlayer2UI() {
    const { width, height } = this.scale;
    const halfHeight = height / 2;
    const topMargin = halfHeight + 20;
    
    // Background bar
    const uiBg = this.add.rectangle(0, topMargin, width, 60, 0x1a1a1a, 0.9);
    uiBg.setOrigin(0, 0);
    uiBg.setScrollFactor(0);
    uiBg.setDepth(100);
    
    // Player label
    const label = this.add.text(20, topMargin + 10, 'PLAYER 2', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FF4488',
    });
    label.setScrollFactor(0);
    label.setDepth(101);
    
    // Gold display
    const goldIcon = this.add.text(20, topMargin + 35, '💰', { fontSize: '16px' });
    goldIcon.setScrollFactor(0);
    goldIcon.setDepth(101);
    
    this.player2GoldText = this.add.text(45, topMargin + 38, '100', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    this.player2GoldText.setScrollFactor(0);
    this.player2GoldText.setDepth(101);
    
    // Mana display
    const manaIcon = this.add.text(140, topMargin + 35, '💎', { fontSize: '16px' });
    manaIcon.setScrollFactor(0);
    manaIcon.setDepth(101);
    
    this.player2ManaText = this.add.text(165, topMargin + 38, '50', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#00FFFF',
    });
    this.player2ManaText.setScrollFactor(0);
    this.player2ManaText.setDepth(101);
    
    // Unit training buttons (right side)
    this.createPlayerButtons(2, width - 500, topMargin + 30);
    
    // Store UI elements
    this.player2UIElements = [uiBg, label, goldIcon, this.player2GoldText, manaIcon, this.player2ManaText];
    
    // Make P2 UI only visible in P2 camera
    this.player2Camera.ignore(this.player1UIElements);
  }
  
  createPlayerButtons(playerNum, startX, y) {
    const buttonSize = 40;
    const spacing = 10;
    const player = playerNum === 1 ? this.player1 : this.player2;
    
    // Get faction-specific units
    let unitConfig;
    if (player.faction === 'roman') unitConfig = CONFIG.UNITS;
    else if (player.faction === 'viking') unitConfig = CONFIG.VIKING_UNITS;
    else unitConfig = CONFIG.ALIEN_UNITS;
    
    const units = Object.entries(unitConfig);
    
    player.unitButtons = [];
    
    units.slice(0, 5).forEach(([key, config], index) => {
      const x = startX + index * (buttonSize + spacing);
      
      const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0x333333);
      button.setInteractive({ useHandCursor: true });
      button.setStrokeStyle(2, 0x555555);
      button.setScrollFactor(0);
      button.setDepth(102);
      
      // Cost text
      const costText = this.add.text(x, y + 15, `${config.cost}`, {
        fontSize: '8px',
        fontFamily: 'Arial',
        color: '#FFD700',
      });
      costText.setOrigin(0.5);
      costText.setScrollFactor(0);
      costText.setDepth(103);
      
      // Hotkey indicator (top-left corner)
      const hotkeyNum = playerNum === 1 ? (index + 1) : (index + 6); // P1: 1-5, P2: 6-0 (displayed as 6,7,8,9,0)
      const hotkeyDisplay = hotkeyNum === 10 ? '0' : hotkeyNum.toString();
      const hotkeyText = this.add.text(x - buttonSize/2 + 3, y - buttonSize/2 + 2, hotkeyDisplay, {
        fontSize: '7px',
        fontFamily: 'Arial',
        color: '#AAAAAA',
      });
      hotkeyText.setOrigin(0);
      hotkeyText.setScrollFactor(0);
      hotkeyText.setDepth(103);
      
      button.on('pointerdown', () => {
        this.spawnUnit(playerNum, key, config);
      });
      
      player.unitButtons.push({ button, costText, key, config });
      
      if (playerNum === 1) {
        this.player1UIElements.push(button, costText, hotkeyText);
      } else {
        this.player2UIElements.push(button, costText, hotkeyText);
      }
    });
  }
  
  getAllPlayer2UIElements() {
    return this.player2UIElements || [];
  }
  
  setupControls() {
    // P1 controls: Mouse in top half, A/D for camera, 1-5 for units, Q/W/E/R for spells
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keysP1 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      unit1: Phaser.Input.Keyboard.KeyCodes.ONE,
      unit2: Phaser.Input.Keyboard.KeyCodes.TWO,
      unit3: Phaser.Input.Keyboard.KeyCodes.THREE,
      unit4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      unit5: Phaser.Input.Keyboard.KeyCodes.FIVE,
      spell1: Phaser.Input.Keyboard.KeyCodes.Q,
      spell2: Phaser.Input.Keyboard.KeyCodes.W,
      spell3: Phaser.Input.Keyboard.KeyCodes.E,
      spell4: Phaser.Input.Keyboard.KeyCodes.R,
    });
    
    // P2 controls: Mouse in bottom half, Arrow keys for camera, 6-0 for units, U/I/O/P for spells
    this.keysP2 = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      unit1: Phaser.Input.Keyboard.KeyCodes.SIX,
      unit2: Phaser.Input.Keyboard.KeyCodes.SEVEN,
      unit3: Phaser.Input.Keyboard.KeyCodes.EIGHT,
      unit4: Phaser.Input.Keyboard.KeyCodes.NINE,
      unit5: Phaser.Input.Keyboard.KeyCodes.ZERO,
      spell1: Phaser.Input.Keyboard.KeyCodes.U,
      spell2: Phaser.Input.Keyboard.KeyCodes.I,
      spell3: Phaser.Input.Keyboard.KeyCodes.O,
      spell4: Phaser.Input.Keyboard.KeyCodes.P,
    });
    
    // Setup hotkey handlers for both players
    this.setupHotkeyHandlers();
  }
  
  setupHotkeyHandlers() {
    // P1 Unit training hotkeys (1-5)
    const p1UnitKeys = [
      this.keysP1.unit1, this.keysP1.unit2, this.keysP1.unit3, 
      this.keysP1.unit4, this.keysP1.unit5
    ];
    
    p1UnitKeys.forEach((key, index) => {
      key.on('down', () => {
        if (this.isGameOver) return;
        
        if (this.player1 && this.player1.unitButtons && this.player1.unitButtons[index]) {
          const unitButton = this.player1.unitButtons[index];
          const unitKey = unitButton.key;
          const config = unitButton.config;
          
          if (config) {
            this.spawnUnit(1, unitKey, config);
          }
        }
      });
    });
    
    // P2 Unit training hotkeys (6-0)
    const p2UnitKeys = [
      this.keysP2.unit1, this.keysP2.unit2, this.keysP2.unit3, 
      this.keysP2.unit4, this.keysP2.unit5
    ];
    
    p2UnitKeys.forEach((key, index) => {
      key.on('down', () => {
        if (this.isGameOver) return;
        
        if (this.player2 && this.player2.unitButtons && this.player2.unitButtons[index]) {
          const unitButton = this.player2.unitButtons[index];
          const unitKey = unitButton.key;
          const config = unitButton.config;
          
          if (config) {
            this.spawnUnit(2, unitKey, config);
          }
        }
      });
    });
    
    // P1 Spell hotkeys (Q/W/E/R)
    const p1SpellKeys = [
      this.keysP1.spell1, this.keysP1.spell2, 
      this.keysP1.spell3, this.keysP1.spell4
    ];
    
    p1SpellKeys.forEach((key, index) => {
      key.on('down', () => {
        if (this.isGameOver) return;
        
        const spellButtonsArray = Object.values(this.player1SpellButtons || {});
        if (spellButtonsArray[index]) {
          const spellButton = spellButtonsArray[index];
          const spellKey = spellButton.spellKey;
          
          const cooldown = this.player1SpellCooldowns[spellKey] || 0;
          const cost = this.getSpellCost(spellKey);
          
          if (cooldown <= 0 && this.player1Mana >= cost) {
            this.activeP1Spell = spellKey;
            this.input.once('pointerdown', (pointer) => {
              if (this.isGameOver) return;
              if (pointer.y > this.scale.height / 2) return; // P1 only clicks top half
              
              const worldX = pointer.worldX;
              const worldY = pointer.worldY;
              
              this.castSpell(1, spellKey, worldX, worldY);
              this.activeP1Spell = null;
            });
          }
        }
      });
    });
    
    // P2 Spell hotkeys (U/I/O/P)
    const p2SpellKeys = [
      this.keysP2.spell1, this.keysP2.spell2, 
      this.keysP2.spell3, this.keysP2.spell4
    ];
    
    p2SpellKeys.forEach((key, index) => {
      key.on('down', () => {
        if (this.isGameOver) return;
        
        const spellButtonsArray = Object.values(this.player2SpellButtons || {});
        if (spellButtonsArray[index]) {
          const spellButton = spellButtonsArray[index];
          const spellKey = spellButton.spellKey;
          
          const cooldown = this.player2SpellCooldowns[spellKey] || 0;
          const cost = this.getSpellCost(spellKey);
          
          if (cooldown <= 0 && this.player2Mana >= cost) {
            this.activeP2Spell = spellKey;
            this.input.once('pointerdown', (pointer) => {
              if (this.isGameOver) return;
              if (pointer.y < this.scale.height / 2) return; // P2 only clicks bottom half
              
              const worldX = pointer.worldX;
              const worldY = pointer.worldY;
              
              this.castSpell(2, spellKey, worldX, worldY);
              this.activeP2Spell = null;
            });
          }
        }
      });
    });
  }
  
  getSpellCost(spellKey) {
    // Return spell cost based on spell key
    if (spellKey === 'shieldWall') return CONFIG.SHIELD_WALL.cost;
    if (spellKey === 'rainOfPila') return CONFIG.RAIN_OF_PILA.cost;
    if (spellKey === 'healingSpring') return CONFIG.HEALING_SPRING.cost;
    if (spellKey === 'plasmaBomb') return CONFIG.PLASMA_BOMB.cost;
    if (spellKey === 'mindControl') return CONFIG.MIND_CONTROL.cost;
    if (spellKey === 'teleport') return CONFIG.TELEPORT.cost;
    if (spellKey === 'thorLightning') return CONFIG.THOR_LIGHTNING.cost;
    if (spellKey === 'battleRage') return CONFIG.BATTLE_RAGE.cost;
    if (spellKey === 'frostShield') return CONFIG.FROST_SHIELD.cost;
    return 0;
  }
  
  spawnInitialUnits() {
    // P1 starting units (left side)
    let workerConfig, worker1;
    if (this.player1Faction === 'roman') {
      workerConfig = CONFIG.UNITS.worker;
      worker1 = new Worker(this, CONFIG.PLAYER_BASE_X - 100, this.groundY - 40, workerConfig, false);
    } else if (this.player1Faction === 'viking') {
      workerConfig = CONFIG.VIKING_UNITS.thrall;
      worker1 = new Thrall(this, CONFIG.PLAYER_BASE_X - 100, this.groundY - 40, workerConfig, false);
    } else {
      workerConfig = CONFIG.ALIEN_UNITS.harvester;
      worker1 = new Harvester(this, CONFIG.PLAYER_BASE_X - 100, this.groundY - 40, workerConfig, false);
    }
    this.player1.units.push(worker1);
    
    // P2 starting units (right side)
    let workerConfig2, worker2;
    if (this.player2Faction === 'roman') {
      workerConfig2 = CONFIG.UNITS.worker;
      worker2 = new Worker(this, CONFIG.ENEMY_BASE_X + 100, this.groundY - 40, workerConfig2, true);
    } else if (this.player2Faction === 'viking') {
      workerConfig2 = CONFIG.VIKING_UNITS.thrall;
      worker2 = new Thrall(this, CONFIG.ENEMY_BASE_X + 100, this.groundY - 40, workerConfig2, true);
    } else {
      workerConfig2 = CONFIG.ALIEN_UNITS.harvester;
      worker2 = new Harvester(this, CONFIG.ENEMY_BASE_X + 100, this.groundY - 40, workerConfig2, true);
    }
    this.player2.units.push(worker2);
  }
  
  spawnUnit(playerNum, unitKey, unitConfig) {
    const player = playerNum === 1 ? this.player1 : this.player2;
    const enemyPlayer = playerNum === 1 ? this.player2 : this.player1;
    const baseX = playerNum === 1 ? CONFIG.PLAYER_BASE_X : CONFIG.ENEMY_BASE_X;
    const isEnemy = playerNum === 2;
    
    // Check afford and cooldown
    if (player.gold < unitConfig.cost) return;
    if (player.cooldowns[unitKey] > 0) return;
    
    // Deduct cost
    player.gold -= unitConfig.cost;
    
    // Start cooldown
    player.cooldowns[unitKey] = unitConfig.cooldown;
    
    // Spawn unit
    let unit;
    if (unitConfig.name === 'Worker') {
      unit = new Worker(this, baseX + (isEnemy ? 100 : -100), this.groundY - 40, unitConfig, isEnemy);
    } else if (unitConfig.name === 'Harvester') {
      unit = new Harvester(this, baseX + (isEnemy ? 100 : -100), this.groundY - 40, unitConfig, isEnemy);
    } else if (unitConfig.name === 'Thrall') {
      unit = new Thrall(this, baseX + (isEnemy ? 100 : -100), this.groundY - 40, unitConfig, isEnemy);
    } else {
      unit = new Unit(this, baseX + (isEnemy ? 100 : -100), this.groundY - 40, unitConfig, isEnemy);
    }
    
    player.units.push(unit);
    
    // Spawn animation
    unit.setScale(0);
    this.tweens.add({
      targets: unit,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Update resources display
    this.player1GoldText.setText(`${Math.floor(this.player1.gold)}`);
    this.player2GoldText.setText(`${Math.floor(this.player2.gold)}`);
    this.player1ManaText.setText(`${Math.floor(this.player1.mana)}`);
    this.player2ManaText.setText(`${Math.floor(this.player2.mana)}`);
    
    // Update cooldowns
    Object.keys(this.player1.cooldowns).forEach(key => {
      if (this.player1.cooldowns[key] > 0) {
        this.player1.cooldowns[key] -= delta;
      }
    });
    
    Object.keys(this.player2.cooldowns).forEach(key => {
      if (this.player2.cooldowns[key] > 0) {
        this.player2.cooldowns[key] -= delta;
      }
    });
    
    // Update units
    this.player1.units = this.player1.units.filter(u => !u.isDead);
    this.player2.units = this.player2.units.filter(u => !u.isDead);
    
    this.player1.units.forEach(unit => {
      // Set enemies for targeting
      unit.scene.playerUnits = this.player1.units;
      unit.scene.enemyUnits = this.player2.units;
      unit.scene.playerBase = this.player1Base;
      unit.scene.enemyBase = this.player2Base;
      unit.update(time, delta);
    });
    
    this.player2.units.forEach(unit => {
      // Set enemies for targeting
      unit.scene.playerUnits = this.player2.units;
      unit.scene.enemyUnits = this.player1.units;
      unit.scene.playerBase = this.player2Base;
      unit.scene.enemyBase = this.player1Base;
      unit.update(time, delta);
    });
    
    // Update cameras (P1 controls)
    const cameraSpeed = 8;
    if (this.keysP1.left.isDown) {
      this.player1Camera.scrollX -= cameraSpeed;
    }
    if (this.keysP1.right.isDown) {
      this.player1Camera.scrollX += cameraSpeed;
    }
    
    // P2 camera controls
    if (this.keysP2.left.isDown) {
      this.player2Camera.scrollX -= cameraSpeed;
    }
    if (this.keysP2.right.isDown) {
      this.player2Camera.scrollX += cameraSpeed;
    }
    
    // Check win conditions
    if (this.player1Base.isDead && !this.isGameOver) {
      this.endGame(2);
    } else if (this.player2Base.isDead && !this.isGameOver) {
      this.endGame(1);
    }
  }
  
  endGame(winnerNum) {
    this.isGameOver = true;
    
    const gameTime = Math.floor((this.time.now - this.gameStartTime) / 1000);
    const winner = winnerNum === 1 ? this.player1 : this.player2;
    const loser = winnerNum === 1 ? this.player2 : this.player1;
    
    // Store stats
    this.registry.set('multiplayerWinner', winnerNum);
    this.registry.set('multiplayerStats', {
      gameTime,
      p1Units: this.player1.units.length,
      p2Units: this.player2.units.length,
      p1Gold: Math.floor(this.player1.gold),
      p2Gold: Math.floor(this.player2.gold),
    });
    
    // Transition to victory scene
    this.time.delayedCall(1000, () => {
      this.scene.start('MultiplayerVictoryScene');
    });
  }
}
