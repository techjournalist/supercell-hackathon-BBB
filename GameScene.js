import Phaser from 'phaser';
import * as Tone from 'tone';
import { CONFIG } from './config.js';
import { UI_CONSTANTS } from './UIConstants.js';
import { SpellSystem } from './SpellSystem.js';
import { UIManager } from './UIManager.js';
import { stateManager } from './StateManager.js';
import { Unit } from './Unit.js';
import { Worker } from './Worker.js';
import { Harvester } from './Harvester.js';
import { Base } from './Base.js';
import { GoldMine } from './GoldMine.js';
import { Minimap } from './Minimap.js';
import { Aqueduct } from './Aqueduct.js';
import { AchievementManager } from './AchievementManager.js';
import { AudioManager } from './AudioManager.js';
import { soundEffects } from './SoundEffectsManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  
  preload() {
    // Load background assets
    this.load.image('sky', 'https://rosebud.ai/assets/purple-sky-background.webp?764C');
    this.load.image('mountains', 'https://rosebud.ai/assets/mountains-layer.webp?hr6l');
    this.load.image('ground', 'https://rosebud.ai/assets/ground-terrain.webp?y66d');
    
    // Load combat music
    this.load.audio('battle-music', 'https://rosebud.ai/assets/battle-music-1.mp3?TljJ');
    
    // Load castle assets
    this.load.image('player-castle', 'https://rosebud.ai/assets/player-castle.webp?v688');
    this.load.image('alien-base', 'https://rosebud.ai/assets/alien-base.webp?YyOt');
    this.load.image('viking-base', 'https://rosebud.ai/assets/viking-base.webp.webp?TXvW');
    
    // Load unit assets - Roman units (player)
    this.load.image('worker', 'https://rosebud.ai/assets/worker-unit.webp?J01Z');
    this.load.image('legionary', 'https://rosebud.ai/assets/legionary-unit.webp?qjIO');
    this.load.image('pilum', 'https://rosebud.ai/assets/pilum-thrower-unit.webp?T3tA');
    this.load.image('centurion', 'https://rosebud.ai/assets/centurion-unit.webp?DAva');
    this.load.image('scout', 'https://rosebud.ai/assets/scout-unit.webp?YOqf');
    
    // Load unit assets - Alien units (enemy)
    this.load.image('harvester', 'https://rosebud.ai/assets/harvester-unit.webp?Rn3x');
    this.load.image('alien-scout', 'https://rosebud.ai/assets/alien-scout-unit.webp.webp?fkPM');
    this.load.image('drone', 'https://rosebud.ai/assets/drone-unit.webp?15fr');
    this.load.image('blaster', 'https://rosebud.ai/assets/blaster-unit.webp?jDED');
    this.load.image('overlord', 'https://rosebud.ai/assets/overlord-unit.webp?htbf');
    
    // Load unit assets - Viking units
    this.load.image('thrall', 'https://rosebud.ai/assets/thrall-unit.webp.webp?KkBj');
    this.load.image('berserker', 'https://rosebud.ai/assets/berserker-unit.webp.webp?J07Q');
    this.load.image('axeThrower', 'https://rosebud.ai/assets/axe-thrower-unit.webp.webp?IyG2');
    this.load.image('jarl', 'https://rosebud.ai/assets/jarl-unit.webp.webp?QY82');
    
    // Legacy units (if needed)
    this.load.image('knight', 'https://rosebud.ai/assets/knight-unit.webp?ZAkc');
    this.load.image('archer', 'https://rosebud.ai/assets/archer-unit.webp?5aNE');
    this.load.image('enemy-warrior', 'https://rosebud.ai/assets/enemy-warrior.webp?3gAe');
    
    // Load resource assets
    this.load.image('gold-mine', 'https://rosebud.ai/assets/gold-mine.webp?zSoi');
    this.load.image('alien-mine', 'https://rosebud.ai/assets/alien-mine.webp?qbWt');
    this.load.image('viking-mine', 'https://rosebud.ai/assets/viking-mine.webp.webp?SnGW');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Apply saved volume setting
    const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '0.7');
    if (window.Tone && window.Tone.Destination) {
      try {
        Tone.Destination.volume.value = Tone.gainToDb(savedVolume);
      } catch (e) {
        console.log('Tone.js volume set failed:', e);
      }
    }
    
    // Initialize combat music with cross-fade from menu
    this.combatMusic = null;
    this.startCombatMusic();
    
    // Initialize sound effects manager on first user interaction
    this.input.once('pointerdown', async () => {
      await soundEffects.initialize();
      console.log('SoundEffectsManager initialized');
    });
    
    // Battle intensity tracking
    this.battleIntensity = 0; // 0 to 1 scale
    this.lastIntensityUpdate = 0;
    this.baseVolume = 0.7; // Base music volume
    this.maxVolumeBoost = 0.3; // Can increase up to +30% volume
    this.intensityIconPulsing = false; // Track if icon pulse animation is active
    
    // Initialize managers
    this.spellSystem = new SpellSystem(this);
    this.uiManager = new UIManager(this);
    
    // Get game mode from registry
    this.campaignLevel = this.registry.get('campaignLevel');
    this.vikingCampaign = this.registry.get('vikingCampaign');
    this.alienCampaign = this.registry.get('alienCampaign');
    this.alienLevel = this.registry.get('alienLevel');
    this.skirmishDifficulty = this.registry.get('skirmishDifficulty');
    this.challengeMode = this.registry.get('challengeMode');
    
    // Calculate ground level
    this.groundY = height * 0.75;
    
    // Set world bounds
    this.physics.world.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);
    
    // Create layered background with parallax
    this.createBackground();
    
    // Setup camera
    this.setupCamera();
    
    // Initialize game state (may be overridden by campaign settings)
    this.gold = CONFIG.STARTING_GOLD;
    this.enemyGold = CONFIG.STARTING_GOLD;  // AI gold
    this.mana = CONFIG.STARTING_MANA;
    this.enemyMana = CONFIG.STARTING_MANA;  // AI mana
    
    // Campaign-specific state
    this.campaignObjective = null;
    this.campaignComplete = false;
    this.survivalTimer = 0;
    this.spellsCastThisLevel = { lightning: false, heal: false, boost: false };
    
    // Skirmish AI state
    this.aiPhase = 'initial_miners'; // Track AI strategy phase
    this.aiMinerCount = 0;
    this.aiManaSourceBuilt = false;
    
    // Exploration AI
    this.explorationAIEnabled = true; // Enabled by default
    
    // Unit arrays
    this.playerUnits = [];
    this.enemyUnits = [];
    
    // Structures
    this.aqueduct = null;
    this.aqueductButtonState = 'build';  // 'build', 'upgrade', 'upgraded'
    
    // Probe beam state
    this.probeBeamCooldown = 0;
    this.probeBeamActive = false;
    
    // Spell cooldowns
    this.spellCooldowns = {
      shieldWall: 0,
      rainOfPila: 0,
      healingSpring: 0,
    };
    this.activeSpell = null;  // Currently selected spell waiting for target
    
    // Alien spell cooldowns (AI only)
    this.alienSpellCooldowns = {
      mindControl: 0,
      plasmaBomb: 0,
    };
    this.lastAISpellCheck = 0;
    
    // Upgrades purchased
    this.romanUpgrades = {
      armor: false,
      weapon: false,
    };
    
    this.alienUpgrades = {
      cloningVats: false,
      plasmaInfusion: false,
      exoskeleton: false,
      warpDrive: false,
    };
    
    this.lastAIUpgradeCheck = 0;
    
    // Spawn cooldowns
    this.unitCooldowns = {};
    Object.keys(CONFIG.UNITS).forEach(key => {
      this.unitCooldowns[key] = 0;
    });
    
    // AI scout tracking
    this.lastAIScoutSpawn = 0;
    this.aiScoutTargets = []; // Track scouted player unit positions
    this.lastScoutWarningTime = 0; // Throttle scout detection warnings
    
    // Create bases
    this.createBases();
    
    // Create gold mines
    this.createGoldMines();
    
    // Create UI (fixed to camera)
    this.createUI();
    
    // Create minimap
    this.createMinimap();
    
    // Setup camera controls
    this.setupCameraControls();
    
    // Create fog of war system
    this.createFogOfWar();
    
    // Spawn initial units
    this.spawnInitialUnits();
    
    // Apply campaign level settings if in campaign mode
    if (this.campaignLevel) {
      if (this.vikingCampaign) {
        this.applyVikingCampaignSettings();
      } else {
        this.applyCampaignSettings();
      }
    } else if (this.alienCampaign) {
      this.applyAlienCampaignSettings();
    }
    
    // Apply skirmish difficulty settings if in skirmish mode
    if (this.skirmishDifficulty) {
      this.applySkirmishDifficulty();
    }
    
    // Apply challenge mode settings if active
    if (this.challengeMode) {
      this.applyChallengeModeSettings();
    }
    
    // AI system
    this.lastAISpawn = 0;
    this.lastAIProbeBeam = 0;
    
    // Game over flag
    this.isGameOver = false;
    
    // Initialize stats tracking
    this.stats = {
      unitsTrained: 0,
      goldEarned: CONFIG.STARTING_GOLD,
      goldSpent: 0,
      spellsCast: 0,
      startTime: 0,
      timeElapsed: 0,
      enemiesKilled: 0,
      unitsLost: 0,
    };
    
    // Start tracking time
    this.stats.startTime = this.time.now;
    
    // Initialize achievement manager
    this.achievementManager = new AchievementManager(this);
    
    // Achievement tracking
    this.firstKill = false;
    this.totalKills = parseInt(localStorage.getItem('total_kills') || '0');
    
    // Game speed control
    this.gameSpeed = 1;  // 1x, 2x, 3x, 4x, 5x, 10x, or 20x
    this.game.loop.timeScale = 1;  // Reset game speed
    
    // Fade in from black
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }
  
  createBackground() {
    const { width, height } = this.scale;
    
    // Sky - fixed to camera viewport, always covers full screen
    this.sky = this.add.image(width / 2, height / 2, 'sky');
    this.sky.setDisplaySize(width, height);
    this.sky.setScrollFactor(0);  // Fixed to camera
    this.sky.setDepth(0);
    this.sky.setTint(0x9090c0); // Slightly darker tint
    
    // Mountains layer - slow parallax, spans full world
    this.mountains = this.add.tileSprite(CONFIG.WORLD_WIDTH / 2, height / 2, CONFIG.WORLD_WIDTH * 1.5, height, 'mountains');
    this.mountains.setScrollFactor(0.3);  // Parallax effect
    this.mountains.setDepth(1);
    this.mountains.setTint(0x8080b0); // Slightly darker mountains
    
    // Ground - extends full world width with darker color
    this.ground = this.add.tileSprite(CONFIG.WORLD_WIDTH / 2, this.groundY, CONFIG.WORLD_WIDTH * 1.5, height * 0.4, 'ground');
    this.ground.setScrollFactor(1);  // Moves with camera
    this.ground.setDepth(2);
    this.ground.setTint(0x607050); // Darker, moodier green-brown tone
  }
  
  setupCamera() {
    const { width, height } = this.scale;
    
    // Set camera bounds to world
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);
    
    // Start camera at player base
    this.cameras.main.scrollX = 0;
    
    // Store for edge scrolling
    this.cameraScrolling = { left: false, right: false };
  }
  
  setupCameraControls() {
    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    // Unit training hotkeys (1-5)
    this.key1 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    this.key2 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    this.key3 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
    this.key4 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FOUR);
    this.key5 = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.FIVE);
    
    // Spell hotkeys (Q/W/E/R for faction-specific spells)
    this.keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    
    // Setup hotkey press handlers
    this.setupHotkeyHandlers();
    
    // Mouse edge scrolling
    this.input.on('pointermove', (pointer) => {
      if (this.isGameOver) return;
      
      const screenWidth = this.scale.width;
      
      // Check if near left edge
      if (pointer.x < CONFIG.CAMERA_EDGE_ZONE) {
        this.cameraScrolling.left = true;
      } else {
        this.cameraScrolling.left = false;
      }
      
      // Check if near right edge
      if (pointer.x > screenWidth - CONFIG.CAMERA_EDGE_ZONE) {
        this.cameraScrolling.right = true;
      } else {
        this.cameraScrolling.right = false;
      }
    });
  }
  
  setupHotkeyHandlers() {
    // Unit training hotkeys (1-5)
    // Map number keys to unit button indices
    const unitKeys = [this.key1, this.key2, this.key3, this.key4, this.key5];
    
    unitKeys.forEach((key, index) => {
      key.on('down', () => {
        if (this.isGameOver || this.pauseMenu) return;
        
        // Get the corresponding unit button
        if (this.unitButtons && this.unitButtons[index]) {
          const unitButton = this.unitButtons[index];
          const unitKey = unitButton.key;
          const config = CONFIG.UNITS[unitKey];
          
          // Try to spawn the unit (same logic as clicking the button)
          if (config) {
            this.spawnPlayerUnit(unitKey, config);
          }
        }
      });
    });
    
    // Spell hotkeys (Q/W/E/R)
    // Map to spell button order based on faction
    const spellKeys = [this.keyQ, this.keyW, this.keyE, this.keyR];
    
    spellKeys.forEach((key, index) => {
      key.on('down', () => {
        if (this.isGameOver || this.pauseMenu) return;
        
        // Get spell buttons as array (order matches visual layout)
        const spellButtonsArray = Object.values(this.spellButtons || {});
        
        if (spellButtonsArray[index]) {
          const spellButton = spellButtonsArray[index];
          const spellKey = spellButton.spellKey;
          
          // Check if spell is available (not on cooldown and can afford)
          const cooldown = this.spellCooldowns[spellKey] || 0;
          const cost = this.getSpellCost(spellKey);
          
          if (cooldown <= 0 && this.mana >= cost) {
            // Activate spell targeting mode
            this.activeSpell = spellKey;
            this.input.once('pointerdown', (pointer) => {
              if (this.isGameOver) return;
              
              const worldX = pointer.worldX;
              const worldY = pointer.worldY;
              
              this.castSpell(spellKey, worldX, worldY);
              this.activeSpell = null;
            });
            
            // Visual feedback - flash the button
            this.tweens.add({
              targets: spellButton.button,
              alpha: 0.5,
              duration: 100,
              yoyo: true,
            });
          }
        }
      });
    });
  }
  
  getSpellCost(spellKey) {
    return this.spellSystem.getCost(spellKey);
  }
  
  getSpellMaxCooldown(spellKey) {
    return this.spellSystem.getCooldown(spellKey);
  }
  
  drawRadialCooldown(spellButton, cooldown, maxCooldown) {
    this.uiManager.drawRadialCooldown(spellButton, cooldown, maxCooldown);
  }
  
  createBases() {
    // Player base (left side) - Roman castle
    this.playerBase = new Base(
      this,
      CONFIG.PLAYER_BASE_X,
      this.groundY - CONFIG.BASE_Y_OFFSET,
      false,
      'player-castle'
    );
    this.playerBase.setDepth(10); // Above ground (depth 2) and background
    
    // Enemy base (right side) - Alien crashed saucer
    this.enemyBase = new Base(
      this,
      CONFIG.ENEMY_BASE_X,
      this.groundY - CONFIG.BASE_Y_OFFSET,
      true,
      'alien-base'
    );
    this.enemyBase.setDepth(10); // Above ground (depth 2) and background
  }
  
  createGoldMines() {
    // Player mine (left side, near player base) - Roman gold mine
    this.playerMine = new GoldMine(
      this,
      CONFIG.PLAYER_BASE_X + CONFIG.MINE_OFFSET_FROM_BASE,
      this.groundY - 40,
      'gold-mine'
    );
    this.playerMine.setDepth(8); // Above ground, below bases
    
    // Enemy mine (right side, near enemy base) - Alien extractor
    this.enemyMine = new GoldMine(
      this,
      CONFIG.ENEMY_BASE_X - CONFIG.MINE_OFFSET_FROM_BASE,
      this.groundY - 40,
      'alien-mine'
    );
    this.enemyMine.setDepth(8); // Above ground, below bases
    
    // Store enemy mines in array for fog of war
    this.enemyGoldMines = [this.enemyMine];
  }
  
  createUI() {
    const { width, height } = this.scale;
    
    // TOP BAR - Single horizontal toolbar (70px tall, full width)
    const topBarHeight = 70;
    
    // Create top bar with gradient and gold border
    const topBarGraphics = this.add.graphics();
    topBarGraphics.setScrollFactor(0);
    topBarGraphics.setDepth(100);
    
    // Gradient background: lighter at top, darker at bottom
    topBarGraphics.fillGradientStyle(0x0a050f, 0x0a050f, 0x05020a, 0x05020a, 0.95, 0.95, 0.95, 0.95);
    topBarGraphics.fillRect(0, 0, width, topBarHeight);
    
    // Gold border at bottom
    topBarGraphics.lineStyle(1, 0xc9941a, 0.3);
    topBarGraphics.lineBetween(0, topBarHeight, width, topBarHeight);
    
    const topBar = topBarGraphics;
    
    let currentX = 20; // Start from left edge with padding
    const buttonSize = 50;
    const spacing = 8;
    const centerY = topBarHeight / 2;
    
    // GOLD DISPLAY - responsive size with glow
    const resourceFontSize = Math.max(11, Math.min(width * 0.013, 15));
    
    this.goldCoin = this.add.circle(currentX + 15, centerY, 12, 0xFFD700);
    this.goldCoin.setStrokeStyle(2, 0xFF8C00);
    this.goldCoin.setScrollFactor(0);
    this.goldCoin.setDepth(101);
    
    // Add glow effect to gold coin
    const goldGlow = this.add.circle(currentX + 15, centerY, 14, 0xf0c040, 0);
    goldGlow.setScrollFactor(0);
    goldGlow.setDepth(100);
    this.tweens.add({
      targets: goldGlow,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.goldText = this.add.text(currentX + 35, centerY, `${this.gold}`, {
      fontSize: `${resourceFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#f0c040',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.goldText.setOrigin(0, 0.5);
    this.goldText.setScrollFactor(0);
    this.goldText.setDepth(101);
    currentX += 100;
    
    // MANA DISPLAY - responsive size with glow
    this.manaCrystal = this.add.polygon(currentX + 12, centerY, 
      [0, -10, 8, -5, 8, 5, 0, 10, -8, 5, -8, -5], 
      CONFIG.COLORS.mana);
    this.manaCrystal.setStrokeStyle(2, 0x0099CC);
    this.manaCrystal.setScrollFactor(0);
    this.manaCrystal.setDepth(101);
    
    // Add glow effect to mana crystal
    const manaGlow = this.add.circle(currentX + 12, centerY, 13, 0x60a0f0, 0);
    manaGlow.setScrollFactor(0);
    manaGlow.setDepth(100);
    this.tweens.add({
      targets: manaGlow,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 400
    });
    
    this.manaText = this.add.text(currentX + 30, centerY, `${this.mana}`, {
      fontSize: `${resourceFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#60a0f0',
      stroke: '#000000',
      strokeThickness: 3,
    });
    this.manaText.setOrigin(0, 0.5);
    this.manaText.setScrollFactor(0);
    this.manaText.setDepth(101);
    currentX += 100;
    
    // DIVIDER
    const divider1 = this.add.rectangle(currentX, centerY, 2, topBarHeight - 20, 0x666666);
    divider1.setScrollFactor(0);
    divider1.setDepth(101);
    currentX += 15;
    
    // Store starting position for unit buttons
    this.uiStartX = currentX;
    
    // Create all buttons in single horizontal row
    this.createSingleRowToolbar(currentX, centerY, buttonSize, spacing);
    
    // Create enemy base health bar in top-right corner (for campaign)
    if (this.campaignLevel || this.vikingCampaign || this.alienCampaign || this.challengeMode) {
      this.createEnemyBaseHealthUI(width, topBarHeight);
    }
    
    // Create player base health bar in top-left corner
    if (this.campaignLevel || this.vikingCampaign || this.alienCampaign || this.challengeMode || this.skirmishDifficulty) {
      this.createPlayerBaseHealthUI(topBarHeight);
    }
    
    // Store UI references
    this.uiElements = {
      topBar,
      goldCoin: this.goldCoin,
      goldText: this.goldText,
      manaCrystal: this.manaCrystal,
      manaText: this.manaText,
    };
  }
  
  createEnemyBaseHealthUI(width, topBarHeight) {
    const centerY = topBarHeight + 25; // Move BELOW the top bar
    const rightX = width - 220; // Position from right edge
    
    // Background box for better visibility
    this.enemyBaseHealthBg = this.add.rectangle(rightX, centerY - 5, 200, 45, 0x000000, 0.85);
    this.enemyBaseHealthBg.setOrigin(0, 0);
    this.enemyBaseHealthBg.setStrokeStyle(2, 0xFF6666);
    this.enemyBaseHealthBg.setScrollFactor(0);
    this.enemyBaseHealthBg.setDepth(100);
    
    // Enemy base icon/indicator
    this.enemyBaseIcon = this.add.text(rightX + 15, centerY + 10, '🏰', {
      fontSize: '20px',
    });
    this.enemyBaseIcon.setOrigin(0, 0.5);
    this.enemyBaseIcon.setScrollFactor(0);
    this.enemyBaseIcon.setDepth(101);
    this.enemyBaseIcon.setTint(0xFF6666); // Reddish tint for enemy
    
    // "ENEMY BASE" label
    this.enemyBaseLabel = this.add.text(rightX + 45, centerY + 2, 'ENEMY BASE', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#FF6666',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.enemyBaseLabel.setOrigin(0, 0.5);
    this.enemyBaseLabel.setScrollFactor(0);
    this.enemyBaseLabel.setDepth(101);
    
    // Health bar background
    this.enemyBaseHealthBarBg = this.add.rectangle(rightX + 45, centerY + 18, 140, 16, 0x333333, 0.9);
    this.enemyBaseHealthBarBg.setOrigin(0, 0.5);
    this.enemyBaseHealthBarBg.setStrokeStyle(2, 0x666666);
    this.enemyBaseHealthBarBg.setScrollFactor(0);
    this.enemyBaseHealthBarBg.setDepth(101);
    
    // Health bar fill (red)
    this.enemyBaseHealthBarFill = this.add.rectangle(rightX + 47, centerY + 18, 136, 12, 0xFF3333);
    this.enemyBaseHealthBarFill.setOrigin(0, 0.5);
    this.enemyBaseHealthBarFill.setScrollFactor(0);
    this.enemyBaseHealthBarFill.setDepth(102);
    
    // Health text (shows actual numbers)
    this.enemyBaseHealthText = this.add.text(rightX + 115, centerY + 18, '1000/1000', {
      fontSize: '9px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.enemyBaseHealthText.setOrigin(0.5);
    this.enemyBaseHealthText.setScrollFactor(0);
    this.enemyBaseHealthText.setDepth(103);
  }
  
  createPlayerBaseHealthUI(topBarHeight) {
    const centerY = topBarHeight + 25; // Move BELOW the top bar
    const leftX = 20; // Back to left edge
    const labelFontSize = Math.max(9, Math.min(this.scale.width * 0.01, 12));
    const hpFontSize = Math.max(9, Math.min(this.scale.width * 0.01, 11));
    
    // Background box - dark gold theme
    this.playerBaseHealthBg = this.add.rectangle(leftX, centerY - 5, 200, 45, 0x0a050f, 0.85);
    this.playerBaseHealthBg.setOrigin(0, 0);
    this.playerBaseHealthBg.setStrokeStyle(1, 0xc9941a, 0.3);
    this.playerBaseHealthBg.setScrollFactor(0);
    this.playerBaseHealthBg.setDepth(100);
    
    // Player base icon/indicator with gold tint
    this.playerBaseIcon = this.add.text(leftX + 15, centerY + 10, '🏰', {
      fontSize: '20px',
    });
    this.playerBaseIcon.setOrigin(0, 0.5);
    this.playerBaseIcon.setScrollFactor(0);
    this.playerBaseIcon.setDepth(101);
    this.playerBaseIcon.setTint(0xf0c040); // Gold tint
    
    // "YOUR BASE" label - gold theme
    this.playerBaseLabel = this.add.text(leftX + 45, centerY + 2, 'YOUR BASE', {
      fontSize: `${labelFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#c9941a',
      stroke: '#000000',
      strokeThickness: 2,
      letterSpacing: '1px',
    });
    this.playerBaseLabel.setOrigin(0, 0.5);
    this.playerBaseLabel.setScrollFactor(0);
    this.playerBaseLabel.setDepth(101);
    this.playerBaseLabel.setStyle({ textTransform: 'uppercase' });
    
    // Health bar responsive height
    const healthBarHeight = Math.max(6, Math.min(this.scale.height * 0.008, 10));
    
    // Health bar background
    this.playerBaseHealthBarBg = this.add.rectangle(leftX + 45, centerY + 18, 140, healthBarHeight + 4, 0x000000, 0.5);
    this.playerBaseHealthBarBg.setOrigin(0, 0.5);
    this.playerBaseHealthBarBg.setStrokeStyle(1, 0xc9941a, 0.2);
    this.playerBaseHealthBarBg.setScrollFactor(0);
    this.playerBaseHealthBarBg.setDepth(101);
    
    // Health bar fill (green gradient)
    this.playerBaseHealthBarFill = this.add.rectangle(leftX + 47, centerY + 18, 136, healthBarHeight, 0x4a8a2a);
    this.playerBaseHealthBarFill.setOrigin(0, 0.5);
    this.playerBaseHealthBarFill.setScrollFactor(0);
    this.playerBaseHealthBarFill.setDepth(102);
    
    // Health text (shows actual numbers) - cream color
    this.playerBaseHealthText = this.add.text(leftX + 115, centerY + 18, '1000/1000', {
      fontSize: `${hpFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#e8d5a3',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.playerBaseHealthText.setOrigin(0.5);
    this.playerBaseHealthText.setScrollFactor(0);
    this.playerBaseHealthText.setDepth(103);
    
    // Shield icon (initially hidden, shows when under attack)
    this.playerBaseShieldIcon = this.add.text(leftX + 185, centerY + 10, '🛡️', {
      fontSize: '18px',
    });
    this.playerBaseShieldIcon.setOrigin(0.5);
    this.playerBaseShieldIcon.setScrollFactor(0);
    this.playerBaseShieldIcon.setDepth(104);
    this.playerBaseShieldIcon.setVisible(false);
  }
  
  createMinimap() {
    const { width, height } = this.scale;
    const minimapHeight = 30;
    const minimapY = height - minimapHeight / 2;  // At very bottom
    
    this.minimap = new Minimap(
      this,
      width / 2,
      minimapY,
      width,  // Full width
      minimapHeight
    );
  }
  
  createFogOfWar() {
    const { width, height } = this.scale;
    
    // Create fog graphics
    this.fogGraphics = this.add.graphics();
    this.fogGraphics.setDepth(50); // Above ground/units but below UI (UI is at 100+)
    this.fogGraphics.setScrollFactor(1); // Moves with camera
    
    // Fog parameters
    this.fogEnabled = true;
    this.visionRadius = 350; // How far units can see
    this.fogAlpha = 0.85; // Darkness of fog
    
    // Track revealed areas (for permanent vision on visited areas)
    this.revealedAreas = new Set();
    this.revealGridSize = 100; // Grid cell size for tracking
    
    // Initial fog coverage - cover the entire world
    this.updateFogOfWar();
  }
  
  updateFogOfWar() {
    if (!this.fogEnabled || !this.fogGraphics) return;
    
    // Completely disable fog for campaign and skirmish modes
    if (this.campaignLevel || this.vikingCampaign || this.alienCampaign || this.skirmishDifficulty) {
      // Clear any existing fog
      this.fogGraphics.clear();
      // Make sure all enemy units/structures are visible
      this.enemyUnits.forEach(unit => {
        if (!unit.isDead) {
          unit.setVisible(true);
          unit.setAlpha(1);
          if (unit.sprite) unit.sprite.setVisible(true);
          if (unit.goldIcon) unit.goldIcon.setVisible(unit.carryingGold);
          if (unit.healthBar) unit.healthBar.setVisible(true);
          if (unit.healthBarBg) unit.healthBarBg.setVisible(true);
        }
      });
      if (this.enemyBase) {
        this.enemyBase.setVisible(true);
        this.enemyBase.setAlpha(1);
        if (this.enemyBase.healthBar) this.enemyBase.healthBar.setVisible(true);
        if (this.enemyBase.healthBarBg) this.enemyBase.healthBarBg.setVisible(true);
      }
      if (this.enemyGoldMines) {
        this.enemyGoldMines.forEach(mine => {
          mine.setVisible(true);
          mine.setAlpha(1);
        });
      }
      return; // Skip all fog logic
    }
    
    this.fogGraphics.clear();
    
    // Collect vision sources
    const visionSources = [];
    
    // Player base provides vision
    if (this.playerBase) {
      visionSources.push({ x: this.playerBase.x, y: this.playerBase.y, radius: this.visionRadius });
    }
    
    // Player units provide vision
    this.playerUnits.forEach(unit => {
      if (!unit.isDead) {
        // Check if unit is a scout with enhanced vision
        const visionMultiplier = unit.config.visionMultiplier || 1.0;
        const baseUnitVision = this.visionRadius * 0.7; // Normal units see 70% of base
        visionSources.push({ 
          x: unit.x, 
          y: unit.y, 
          radius: baseUnitVision * visionMultiplier 
        });
      }
    });
    
    // Aqueduct provides vision if built
    if (this.aqueduct) {
      visionSources.push({ x: this.aqueduct.x, y: this.aqueduct.y, radius: this.visionRadius * 0.8 });
    }
    
    // Draw base fog
    this.fogGraphics.fillStyle(0x000000, this.fogAlpha);
    this.fogGraphics.fillRect(0, 0, CONFIG.WORLD_WIDTH, this.scale.height);
    
    // Hide enemy units/structures in fog
    this.updateEnemyVisibility();
  }
  
  markAreaAsRevealed(x, y, radius) {
    const gridX = Math.floor(x / this.revealGridSize);
    const gridY = Math.floor(y / this.revealGridSize);
    const gridRadius = Math.ceil(radius / this.revealGridSize);
    
    for (let gx = gridX - gridRadius; gx <= gridX + gridRadius; gx++) {
      for (let gy = gridY - gridRadius; gy <= gridY + gridRadius; gy++) {
        const cellKey = `${gx},${gy}`;
        this.revealedAreas.add(cellKey);
      }
    }
  }
  
  isInPlayerVision(x, y) {
    // Check if position is within vision range of any player unit/structure
    const checkDistance = (sourceX, sourceY, radius) => {
      const dist = Phaser.Math.Distance.Between(x, y, sourceX, sourceY);
      return dist <= radius;
    };
    
    // Check player base
    if (checkDistance(this.playerBase.x, this.playerBase.y, this.visionRadius)) {
      return true;
    }
    
    // Check player units (with scout enhanced vision)
    for (const unit of this.playerUnits) {
      if (!unit.isDead) {
        const visionMultiplier = unit.config.visionMultiplier || 1.0;
        const baseUnitVision = this.visionRadius * 0.7;
        if (checkDistance(unit.x, unit.y, baseUnitVision * visionMultiplier)) {
          return true;
        }
      }
    }
    
    // Check aqueduct
    if (this.aqueduct && checkDistance(this.aqueduct.x, this.aqueduct.y, this.visionRadius * 0.8)) {
      return true;
    }
    
    return false;
  }
  
  updateEnemyVisibility() {
    // Hide/show enemy units based on fog
    this.enemyUnits.forEach(unit => {
      if (!unit.isDead) {
        const inVision = this.isInPlayerVision(unit.x, unit.y);
        unit.setVisible(inVision);
        unit.setAlpha(inVision ? 1 : 0);
        
        // Also hide child sprites
        if (unit.sprite) unit.sprite.setVisible(inVision);
        if (unit.goldIcon) unit.goldIcon.setVisible(inVision && unit.carryingGold);
        if (unit.healthBar) unit.healthBar.setVisible(inVision);
        if (unit.healthBarBg) unit.healthBarBg.setVisible(inVision);
      }
    });
    
    // Hide/show enemy base
    if (this.enemyBase) {
      const inVision = this.isInPlayerVision(this.enemyBase.x, this.enemyBase.y);
      this.enemyBase.setVisible(inVision);
      this.enemyBase.setAlpha(inVision ? 1 : 0.3); // Slight visibility for map awareness
      if (this.enemyBase.healthBar) this.enemyBase.healthBar.setVisible(inVision);
      if (this.enemyBase.healthBarBg) this.enemyBase.healthBarBg.setVisible(inVision);
    }
    
    // Hide/show enemy gold mines
    if (this.enemyGoldMines) {
      this.enemyGoldMines.forEach(mine => {
        const inVision = this.isInPlayerVision(mine.x, mine.y);
        mine.setVisible(inVision);
        mine.setAlpha(inVision ? 1 : 0.3);
      });
    }
  }
  
  createSingleRowToolbar(startX, centerY, buttonSize, spacing) {
    const { width } = this.scale;
    let currentX = startX;
    
    this.unitButtons = [];
    this.spellButtons = {};
    this.upgradeButtons = {};
    this.controlButtons = {};
    
    // Create tooltip container (initially hidden)
    this.createTooltip();
    
    // UNIT TRAINING BUTTONS
    const units = Object.entries(CONFIG.UNITS);
    units.forEach(([key, config], index) => {
      const x = currentX + (buttonSize / 2) + index * (buttonSize + spacing);
      
      const button = this.add.rectangle(x, centerY, buttonSize, buttonSize, 0x2C2C2C);
      button.setInteractive({ useHandCursor: true });
      button.setStrokeStyle(2, 0x555555);
      button.setScrollFactor(0);
      button.setDepth(101);
      
      // Simple icon (emoji or first letter)
      let iconKey;
      if (key === 'worker') iconKey = 'worker';
      else if (key === 'legionary') iconKey = 'legionary';
      else if (key === 'pilum') iconKey = 'pilum';
      else if (key === 'centurion') iconKey = 'centurion';
      
      const icon = this.add.sprite(x, centerY - 5, iconKey);
      icon.setScale(0.06);
      icon.setScrollFactor(0);
      icon.setDepth(102);
      
      // Cost text below
      const costText = this.add.text(x, centerY + 20, `${config.cost}`, {
        fontSize: '10px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 2,
      });
      costText.setOrigin(0.5);
      costText.setScrollFactor(0);
      costText.setDepth(102);
      
      // Hotkey indicator (top-left corner)
      const hotkeyText = this.add.text(x - buttonSize/2 + 5, centerY - buttonSize/2 + 3, `${index + 1}`, {
        fontSize: '9px',
        fontFamily: 'Press Start 2P',
        color: '#AAAAAA',
        stroke: '#000000',
        strokeThickness: 1,
      });
      hotkeyText.setOrigin(0);
      hotkeyText.setScrollFactor(0);
      hotkeyText.setDepth(103);
      
      // Progress fill (inside button)
      const progressFill = this.add.rectangle(x, centerY, 0, buttonSize, 0x4CAF50, 0.5);
      progressFill.setScrollFactor(0);
      progressFill.setDepth(101);
      progressFill.setVisible(false);
      
      button.on('pointerdown', () => {
        soundEffects.playButtonClick();
        this.spawnPlayerUnit(key, config);
      });
      
      button.on('pointerover', () => {
        soundEffects.playButtonHover();
        if (this.canAfford(config.cost) && this.unitCooldowns[key] <= 0) {
          button.setFillStyle(0x3C3C3C);
        }
        this.showTooltip(x, centerY + 35, this.getUnitTooltipText(key, config));
      });
      
      button.on('pointerout', () => {
        button.setFillStyle(0x2C2C2C);
        this.hideTooltip();
      });
      
      this.unitButtons.push({
        key,
        button,
        icon,
        costText,
        progressFill,
        maxCooldown: config.cooldown,
      });
    });
    
    currentX += units.length * (buttonSize + spacing) + 15;
    
    // DIVIDER
    const divider2 = this.add.rectangle(currentX, centerY, 2, 50, 0x666666);
    divider2.setScrollFactor(0);
    divider2.setDepth(101);
    currentX += 15;
    
    // SPELL BUTTONS (3 Roman spells)
    this.createSpellButton(currentX, centerY, buttonSize, 'shieldWall', '🛡️', CONFIG.SHIELD_WALL.cost, 0xFFD700);
    currentX += buttonSize + spacing;
    
    this.createSpellButton(currentX, centerY, buttonSize, 'rainOfPila', '⚔️', CONFIG.RAIN_OF_PILA.cost, 0xFF6600);
    currentX += buttonSize + spacing;
    
    this.createSpellButton(currentX, centerY, buttonSize, 'healingSpring', '💧', CONFIG.HEALING_SPRING.cost, 0x00CED1);
    currentX += buttonSize + spacing + 15;
    
    // DIVIDER
    const divider3 = this.add.rectangle(currentX, centerY, 2, 50, 0x666666);
    divider3.setScrollFactor(0);
    divider3.setDepth(101);
    currentX += 15;
    
    // UPGRADE BUTTONS (Roman + Aqueduct)
    this.createUpgradeButton(currentX, centerY, buttonSize, 'roman', 'armor', '🛡️', CONFIG.ROMAN_UPGRADES.armor.cost);
    currentX += buttonSize + spacing;
    
    this.createUpgradeButton(currentX, centerY, buttonSize, 'roman', 'weapon', '⚔️', CONFIG.ROMAN_UPGRADES.weapon.cost);
    currentX += buttonSize + spacing;
    
    // Aqueduct button
    this.createAqueductButton(currentX, centerY, buttonSize);
    currentX += buttonSize + spacing + 15;
    
    // RIGHT SIDE - CONTROL BUTTONS
    const rightX = width - 150;
    this.createControlButtonsCompact(rightX, centerY, 40, spacing);
    
    // Battle intensity indicator (subtle, near mute button)
    this.createBattleIntensityIndicator(rightX + 200, centerY);
  }
  
  createSpellButton(x, y, size, spellKey, icon, cost, borderColor) {
    const button = this.add.rectangle(x, y, size, size, 0x2C2C2C);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(2, borderColor);
    button.setScrollFactor(0);
    button.setDepth(101);
    
    const spellIcon = this.add.text(x, y - 8, icon, { fontSize: '20px' });
    spellIcon.setOrigin(0.5);
    spellIcon.setScrollFactor(0);
    spellIcon.setDepth(102);
    
    const costText = this.add.text(x, y + 17, `${cost}`, {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#00FFFF',
      stroke: '#000000',
      strokeThickness: 2,
    });
    costText.setOrigin(0.5);
    costText.setScrollFactor(0);
    costText.setDepth(102);
    
    // Hotkey indicator (top-left corner) - Q/W/E/R based on spell order
    const spellOrder = Object.keys(this.spellButtons || {}).length;
    const hotkeyLetter = ['Q', 'W', 'E', 'R'][spellOrder];
    if (hotkeyLetter) {
      const hotkeyText = this.add.text(x - size/2 + 5, y - size/2 + 3, hotkeyLetter, {
        fontSize: '9px',
        fontFamily: 'Press Start 2P',
        color: '#AAAAAA',
        stroke: '#000000',
        strokeThickness: 1,
      });
      hotkeyText.setOrigin(0);
      hotkeyText.setScrollFactor(0);
      hotkeyText.setDepth(103);
    }
    
    // Radial cooldown overlay (arc that fills clockwise)
    const cooldownOverlay = this.add.graphics();
    cooldownOverlay.setScrollFactor(0);
    cooldownOverlay.setDepth(103);
    cooldownOverlay.setVisible(false);
    
    // Cooldown timer text (shows seconds remaining)
    const cooldownText = this.add.text(x, y, '', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    });
    cooldownText.setOrigin(0.5);
    cooldownText.setScrollFactor(0);
    cooldownText.setDepth(104);
    cooldownText.setVisible(false);
    
    button.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.selectSpell(spellKey);
    });
    
    button.on('pointerover', () => {
      soundEffects.playButtonHover();
      if (this.mana >= cost && this.spellCooldowns[spellKey] <= 0) {
        button.setFillStyle(0x3C3C3C);
      }
      this.showTooltip(x, y + 35, this.getSpellTooltipText(spellKey));
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x2C2C2C);
      this.hideTooltip();
    });
    
    this.spellButtons[spellKey] = {
      spellKey,  // Store the spell key for hotkey access
      button,
      icon: spellIcon,
      costText,
      cooldownOverlay,
      cooldownText,
      x,  // Store position for drawing radial overlay
      y,
      size,
    };
  }
  
  createUpgradeButton(x, y, size, faction, upgradeKey, icon, cost) {
    const button = this.add.rectangle(x, y, size, size, 0x2C2C2C);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(2, faction === 'roman' ? 0xDC143C : 0x9C27B0);
    button.setScrollFactor(0);
    button.setDepth(101);
    
    const upgradeIcon = this.add.text(x, y - 8, icon, { fontSize: '20px' });
    upgradeIcon.setOrigin(0.5);
    upgradeIcon.setScrollFactor(0);
    upgradeIcon.setDepth(102);
    
    const costText = this.add.text(x, y + 17, `${cost}`, {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    costText.setOrigin(0.5);
    costText.setScrollFactor(0);
    costText.setDepth(102);
    
    const checkmark = this.add.text(x, y, '✓', {
      fontSize: '30px',
      color: '#00FF00',
    });
    checkmark.setOrigin(0.5);
    checkmark.setScrollFactor(0);
    checkmark.setDepth(104);
    checkmark.setVisible(false);
    
    button.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.purchaseUpgrade(faction, upgradeKey);
    });
    
    button.on('pointerover', () => {
      soundEffects.playButtonHover();
      const upgrades = faction === 'roman' ? this.romanUpgrades : this.alienUpgrades;
      if (!upgrades[upgradeKey] && this.canAfford(cost)) {
        button.setFillStyle(0x3C3C3C);
      }
      this.showTooltip(x, y + 35, this.getUpgradeTooltipText(faction, upgradeKey));
    });
    
    button.on('pointerout', () => {
      button.setFillStyle(0x2C2C2C);
      this.hideTooltip();
    });
    
    this.upgradeButtons[faction + '_' + upgradeKey] = {
      button,
      icon: upgradeIcon,
      costText,
      checkmark,
    };
  }
  
  createAqueductButton(x, y, size) {
    this.aqueductButton = this.add.rectangle(x, y, size, size, 0x2C2C2C);
    this.aqueductButton.setInteractive({ useHandCursor: true });
    this.aqueductButton.setStrokeStyle(2, 0x2196F3);
    this.aqueductButton.setScrollFactor(0);
    this.aqueductButton.setDepth(101);
    
    this.aqueductIcon = this.add.text(x, y - 8, '〰️', { fontSize: '20px' });
    this.aqueductIcon.setOrigin(0.5);
    this.aqueductIcon.setScrollFactor(0);
    this.aqueductIcon.setDepth(102);
    
    this.aqueductCostText = this.add.text(x, y + 17, '100', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.aqueductCostText.setOrigin(0.5);
    this.aqueductCostText.setScrollFactor(0);
    this.aqueductCostText.setDepth(102);
    
    this.aqueductButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      if (this.aqueductButtonState === 'build') {
        this.buildAqueduct();
      } else if (this.aqueductButtonState === 'upgrade') {
        this.upgradeAqueduct();
      }
    });
    
    this.aqueductButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      if ((this.aqueductButtonState === 'build' && this.canAfford(CONFIG.AQUEDUCT_COST)) ||
          (this.aqueductButtonState === 'upgrade' && this.canAfford(CONFIG.AQUEDUCT_UPGRADE_COST))) {
        this.aqueductButton.setFillStyle(0x3C3C3C);
      }
      this.showTooltip(x, y + 35, this.getAqueductTooltipText());
    });
    
    this.aqueductButton.on('pointerout', () => {
      this.aqueductButton.setFillStyle(0x2C2C2C);
      this.hideTooltip();
    });
  }
  
  createControlButtonsCompact(startX, centerY, buttonSize, spacing) {
    // Speed toggle
    const speedX = startX;
    this.speedButton = this.add.rectangle(speedX, centerY, buttonSize, buttonSize, 0x4CAF50);
    this.speedButton.setInteractive({ useHandCursor: true });
    this.speedButton.setStrokeStyle(2, 0xFFFFFF);
    this.speedButton.setScrollFactor(0);
    this.speedButton.setDepth(101);
    
    this.speedText = this.add.text(speedX, centerY, '1x', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    this.speedText.setOrigin(0.5);
    this.speedText.setScrollFactor(0);
    this.speedText.setDepth(102);
    
    this.speedButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.toggleSpeed();
    });
    this.speedButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      this.speedButton.setFillStyle(0x66BB6A);
    });
    this.speedButton.on('pointerout', () => this.speedButton.setFillStyle(0x4CAF50));
    
    // Pause button
    const pauseX = speedX + buttonSize + spacing;
    this.pauseButton = this.add.rectangle(pauseX, centerY, buttonSize, buttonSize, 0xFFA500);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.setStrokeStyle(2, 0xFFFFFF);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setDepth(101);
    
    this.pauseIcon = this.add.text(pauseX, centerY, '⏸', { fontSize: '20px' });
    this.pauseIcon.setOrigin(0.5);
    this.pauseIcon.setScrollFactor(0);
    this.pauseIcon.setDepth(102);
    
    this.pauseButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.togglePause();
    });
    this.pauseButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      this.pauseButton.setFillStyle(0xFFB733);
    });
    this.pauseButton.on('pointerout', () => this.pauseButton.setFillStyle(0xFFA500));
    
    // Menu button
    const menuX = pauseX + buttonSize + spacing;
    this.menuButton = this.add.rectangle(menuX, centerY, buttonSize, buttonSize, 0x2196F3);
    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.setStrokeStyle(2, 0xFFFFFF);
    this.menuButton.setScrollFactor(0);
    this.menuButton.setDepth(101);
    
    this.menuIcon = this.add.text(menuX, centerY, '☰', { fontSize: '24px', color: '#FFFFFF' });
    this.menuIcon.setOrigin(0.5);
    this.menuIcon.setScrollFactor(0);
    this.menuIcon.setDepth(102);
    
    this.menuButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.openMenu();
    });
    this.menuButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      this.menuButton.setFillStyle(0x42A5F5);
    });
    this.menuButton.on('pointerout', () => this.menuButton.setFillStyle(0x2196F3));
    
    // Auto-Scout button (toggle exploration AI)
    const scoutX = menuX + buttonSize + spacing;
    this.explorationButton = this.add.rectangle(scoutX, centerY, buttonSize, buttonSize, 0x9C27B0);
    this.explorationButton.setInteractive({ useHandCursor: true });
    this.explorationButton.setStrokeStyle(2, 0xFFFFFF);
    this.explorationButton.setScrollFactor(0);
    this.explorationButton.setDepth(101);
    
    this.explorationIcon = this.add.text(scoutX, centerY, '🔍', { fontSize: '20px' });
    this.explorationIcon.setOrigin(0.5);
    this.explorationIcon.setScrollFactor(0);
    this.explorationIcon.setDepth(102);
    
    this.explorationButton.on('pointerdown', () => {
      soundEffects.playButtonClick();
      this.toggleExplorationAI();
    });
    this.explorationButton.on('pointerover', () => {
      soundEffects.playButtonHover();
      this.explorationButton.setFillStyle(0xAB47BC);
      this.showTooltip(scoutX, centerY + 30, 'Auto-Scout: ' + (this.explorationAIEnabled ? 'ON' : 'OFF'));
    });
    this.explorationButton.on('pointerout', () => {
      const color = this.explorationAIEnabled ? 0x9C27B0 : 0x555555;
      this.explorationButton.setFillStyle(color);
      this.hideTooltip();
    });
    
    // Set initial color based on state
    this.explorationButton.setFillStyle(this.explorationAIEnabled ? 0x9C27B0 : 0x555555);
    
    // Mute/Unmute button
    const muteX = scoutX + buttonSize + spacing;
    const savedVolume = parseFloat(localStorage.getItem('gameVolume') || '0.7');
    this.isMuted = savedVolume === 0;
    
    this.muteButton = this.add.rectangle(muteX, centerY, buttonSize, buttonSize, this.isMuted ? 0xFF5252 : 0x66BB6A);
    this.muteButton.setInteractive({ useHandCursor: true });
    this.muteButton.setStrokeStyle(2, 0xFFFFFF);
    this.muteButton.setScrollFactor(0);
    this.muteButton.setDepth(101);
    
    this.muteIcon = this.add.text(muteX, centerY, this.isMuted ? '🔇' : '🔊', { fontSize: '20px' });
    this.muteIcon.setOrigin(0.5);
    this.muteIcon.setScrollFactor(0);
    this.muteIcon.setDepth(102);
    
    this.muteButton.on('pointerdown', () => this.toggleMute());
    this.muteButton.on('pointerover', () => {
      const hoverColor = this.isMuted ? 0xFF6B6B : 0x81C784;
      this.muteButton.setFillStyle(hoverColor);
      this.showTooltip(muteX, centerY + 30, this.isMuted ? 'Unmute Audio' : 'Mute Audio');
    });
    this.muteButton.on('pointerout', () => {
      const normalColor = this.isMuted ? 0xFF5252 : 0x66BB6A;
      this.muteButton.setFillStyle(normalColor);
      this.hideTooltip();
    });
    
    this.controlButtons = {
      speedButton: this.speedButton,
      speedText: this.speedText,
      pauseButton: this.pauseButton,
      pauseIcon: this.pauseIcon,
      menuButton: this.menuButton,
      menuIcon: this.menuIcon,
      explorationButton: this.explorationButton,
      explorationIcon: this.explorationIcon,
      muteButton: this.muteButton,
      muteIcon: this.muteIcon,
    };
  }
  
  createBattleIntensityIndicator(x, y) {
    const barWidth = 100;
    const barHeight = 8;
    
    // Background bar
    this.intensityBarBg = this.add.rectangle(x, y, barWidth, barHeight, 0x2C2C2C, 0.8);
    this.intensityBarBg.setOrigin(0, 0.5);
    this.intensityBarBg.setStrokeStyle(1, 0x555555);
    this.intensityBarBg.setScrollFactor(0);
    this.intensityBarBg.setDepth(101);
    
    // Fill bar (gradient from yellow to red)
    this.intensityBarFill = this.add.rectangle(x + 2, y, 0, barHeight - 4, 0xFFAA00);
    this.intensityBarFill.setOrigin(0, 0.5);
    this.intensityBarFill.setScrollFactor(0);
    this.intensityBarFill.setDepth(102);
    
    // Label
    const labelFontSize = Math.max(8, Math.min(this.scale.width * 0.008, 10));
    this.intensityLabel = this.add.text(x, y - 12, 'INTENSITY', {
      fontSize: `${labelFontSize}px`,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      color: '#AAAAAA',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.intensityLabel.setOrigin(0, 0.5);
    this.intensityLabel.setScrollFactor(0);
    this.intensityLabel.setDepth(101);
    
    // Music note icon (shows when intensity is high)
    this.intensityIcon = this.add.text(x + barWidth + 8, y, '♪', {
      fontSize: '16px',
      color: '#FF6600',
      stroke: '#000000',
      strokeThickness: 2,
    });
    this.intensityIcon.setOrigin(0, 0.5);
    this.intensityIcon.setScrollFactor(0);
    this.intensityIcon.setDepth(102);
    this.intensityIcon.setAlpha(0); // Start hidden
  }
  
  toggleExplorationAI() {
    this.explorationAIEnabled = !this.explorationAIEnabled;
    
    // Update button color
    const color = this.explorationAIEnabled ? 0x9C27B0 : 0x555555;
    this.explorationButton.setFillStyle(color);
    
    // Show notification
    const { width } = this.scale;
    const text = this.explorationAIEnabled ? 'Auto-Scout: ON' : 'Auto-Scout: OFF';
    const notification = this.add.text(width / 2, 150, text, {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: this.explorationAIEnabled ? '#9C27B0' : '#FF6B6B',
      stroke: '#000000',
      strokeThickness: 4,
    });
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(1000);
    
    // Fade out notification
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 1500,
      delay: 1000,
      onComplete: () => notification.destroy()
    });
  }
  
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    // Get current volume or use default
    let currentVolume = parseFloat(localStorage.getItem('gameVolume') || '0.7');
    
    if (this.isMuted) {
      // Store current volume before muting
      if (currentVolume > 0) {
        localStorage.setItem('gameVolumeBeforeMute', currentVolume.toString());
      }
      // Set volume to 0
      localStorage.setItem('gameVolume', '0');
      if (window.Tone && window.Tone.Destination) {
        try {
          Tone.Destination.volume.value = -Infinity; // Mute
        } catch (e) {
          console.log('Mute failed:', e);
        }
      }
      // Mute combat music
      this.updateCombatMusicVolume();
    } else {
      // Restore previous volume or use default
      const restoredVolume = parseFloat(localStorage.getItem('gameVolumeBeforeMute') || '0.7');
      localStorage.setItem('gameVolume', restoredVolume.toString());
      if (window.Tone && window.Tone.Destination) {
        try {
          Tone.Destination.volume.value = Tone.gainToDb(restoredVolume);
        } catch (e) {
          console.log('Unmute failed:', e);
        }
      }
      // Unmute combat music
      this.updateCombatMusicVolume();
    }
    
    // Update button appearance
    const buttonColor = this.isMuted ? 0xFF5252 : 0x66BB6A;
    this.muteButton.setFillStyle(buttonColor);
    this.muteIcon.setText(this.isMuted ? '🔇' : '🔊');
    
    // Show notification
    const { width } = this.scale;
    const text = this.isMuted ? 'AUDIO MUTED' : 'AUDIO UNMUTED';
    const notification = this.add.text(width / 2, 150, text, {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: this.isMuted ? '#FF5252' : '#66BB6A',
      stroke: '#000000',
      strokeThickness: 4,
    });
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(1000);
    
    // Fade out notification
    this.tweens.add({
      targets: notification,
      alpha: 0,
      duration: 1500,
      delay: 1000,
      onComplete: () => notification.destroy()
    });
  }
  
  toggleSpeed() {
    // Cycle through 1x -> 2x -> 3x -> 4x -> 5x -> 10x -> 20x -> 1x
    const speedLevels = [1, 2, 3, 4, 5, 10, 20];
    const currentIndex = speedLevels.indexOf(this.gameSpeed);
    const nextIndex = (currentIndex + 1) % speedLevels.length;
    this.gameSpeed = speedLevels[nextIndex];
    
    this.speedText.setText(`${this.gameSpeed}x`);
    
    // Apply speed to multiple Phaser systems for proper acceleration
    this.physics.world.timeScale = 1; // Keep physics at normal speed
    this.time.timeScale = this.gameSpeed; // Scale time events (delays, timers)
    this.tweens.timeScale = this.gameSpeed; // Scale tweens/animations
    this.anims.globalTimeScale = this.gameSpeed; // Scale sprite animations
    this.game.loop.timeScale = this.gameSpeed; // Scale game loop delta
    
    // Show notification for higher speeds
    if (this.gameSpeed >= 10) {
      const { width } = this.scale;
      const notification = this.add.text(width / 2, 150, `TURBO: ${this.gameSpeed}x SPEED!`, {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FF4444',
        stroke: '#000000',
        strokeThickness: 4,
      });
      notification.setOrigin(0.5);
      notification.setScrollFactor(0);
      notification.setDepth(1000);
      
      // Pulse and fade out
      this.tweens.add({
        targets: notification,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        repeat: 2,
      });
      
      this.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 1000,
        delay: 1200,
        onComplete: () => notification.destroy()
      });
    }
  }
  
  // DUPLICATE OLD METHODS START HERE - TO BE REMOVED
  createTopToolbarOLD() {
    const { width, height } = this.scale;
    const safeTop = height * CONFIG.SAFE_AREA.top;
    const buttonSize = 80;
    const buttonSpacing = 15;
    const numButtons = Object.keys(CONFIG.UNITS).length;
    const totalWidth = (buttonSize * numButtons) + (buttonSpacing * (numButtons - 1));
    const startX = width / 2 - totalWidth / 2;
    
    this.unitButtons = [];
    
    const units = Object.entries(CONFIG.UNITS);
    
    units.forEach(([key, config], index) => {
      const x = startX + (buttonSize / 2) + index * (buttonSize + buttonSpacing);
      const y = safeTop + 90;
      
      // Button background (square)
      const button = this.add.rectangle(x, y, buttonSize, buttonSize, CONFIG.COLORS.buttonBg);
      button.setInteractive({ useHandCursor: true });
      button.setStrokeStyle(3, 0xffffff);
      button.setScrollFactor(0);
      button.setDepth(100);
      
      // Unit icon (larger, centered)
      let iconKey;
      if (key === 'worker') iconKey = 'worker';
      else if (key === 'legionary') iconKey = 'legionary';
      else if (key === 'pilum') iconKey = 'pilum';
      else if (key === 'centurion') iconKey = 'centurion';
      else if (key === 'knight') iconKey = 'knight';
      else if (key === 'archer') iconKey = 'archer';
      
      const icon = this.add.sprite(x, y - 5, iconKey);
      icon.setScale(0.09);
      icon.setScrollFactor(0);
      icon.setDepth(100);
      
      // Cost text below icon
      const costText = this.add.text(x, y + 28, `${config.cost}`, {
        fontSize: '16px',
        fontFamily: 'Press Start 2P',
        color: '#FFD700',
        stroke: '#000000',
        strokeThickness: 3,
      });
      costText.setOrigin(0.5);
      costText.setScrollFactor(0);
      costText.setDepth(100);
      
      // Gold coin icon next to cost
      const coinIcon = this.add.circle(x - 28, y + 28, 8, 0xFFD700);
      coinIcon.setStrokeStyle(2, 0xFF8C00);
      coinIcon.setScrollFactor(0);
      coinIcon.setDepth(100);
      
      // Cooldown overlay (initially hidden)
      const cooldownOverlay = this.add.rectangle(x, y, buttonSize, buttonSize, CONFIG.COLORS.cooldownOverlay, 0.7);
      cooldownOverlay.setScrollFactor(0);
      cooldownOverlay.setDepth(101);
      cooldownOverlay.setVisible(false);
      
      // Cooldown progress bar
      const cooldownBar = this.add.rectangle(x, y + buttonSize / 2 - 5, buttonSize, 8, 0x4CAF50);
      cooldownBar.setScrollFactor(0);
      cooldownBar.setDepth(102);
      cooldownBar.setVisible(false);
      
      // Button interactions
      button.on('pointerdown', () => {
        this.spawnPlayerUnit(key, config);
      });
      
      button.on('pointerover', () => {
        if (this.canAfford(config.cost) && this.unitCooldowns[key] <= 0) {
          button.setFillStyle(CONFIG.COLORS.buttonBgHover);
        }
      });
      
      button.on('pointerout', () => {
        button.setFillStyle(CONFIG.COLORS.buttonBg);
      });
      
      this.unitButtons.push({
        key,
        button,
        icon,
        costText,
        coinIcon,
        cooldownOverlay,
        cooldownBar,
        maxCooldown: config.cooldown,
      });
    });
  }
  
  createSpecialButtons() {
    const { width, height } = this.scale;
    const safeTop = height * CONFIG.SAFE_AREA.top;
    const safeRight = width - (width * CONFIG.SAFE_AREA.right);
    
    const buttonSize = 80;
    const spacing = 15;
    
    // Aqueduct button (Roman - player only)
    const aqueductX = safeRight - buttonSize / 2;
    const aqueductY = safeTop + 90;
    
    this.aqueductButton = this.add.rectangle(aqueductX, aqueductY, buttonSize, buttonSize, CONFIG.COLORS.buttonBg);
    this.aqueductButton.setInteractive({ useHandCursor: true });
    this.aqueductButton.setStrokeStyle(3, 0xffffff);
    this.aqueductButton.setScrollFactor(0);
    this.aqueductButton.setDepth(100);
    
    // Aqueduct icon (water waves)
    const aqueductIcon = this.add.text(aqueductX, aqueductY - 10, '〰️', {
      fontSize: '32px',
    });
    aqueductIcon.setOrigin(0.5);
    aqueductIcon.setScrollFactor(0);
    aqueductIcon.setDepth(100);
    
    const aqueductLabel = this.add.text(aqueductX, aqueductY + 20, 'AQ', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#ffffff',
    });
    aqueductLabel.setOrigin(0.5);
    aqueductLabel.setScrollFactor(0);
    aqueductLabel.setDepth(100);
    
    // Aqueduct cost
    const aqueductCost = this.add.text(aqueductX, aqueductY + 35, '100', {
      fontSize: '12px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    aqueductCost.setOrigin(0.5);
    aqueductCost.setScrollFactor(0);
    aqueductCost.setDepth(100);
    
    this.aqueductButton.on('pointerdown', () => {
      if (this.aqueductButtonState === 'build') {
        this.buildAqueduct();
      } else if (this.aqueductButtonState === 'upgrade') {
        this.upgradeAqueduct();
      }
    });
    
    this.aqueductButton.on('pointerover', () => {
      if (this.aqueductButtonState === 'build' && this.canAfford(CONFIG.AQUEDUCT_COST)) {
        this.aqueductButton.setFillStyle(CONFIG.COLORS.buttonBgHover);
      } else if (this.aqueductButtonState === 'upgrade' && this.canAfford(CONFIG.AQUEDUCT_UPGRADE_COST)) {
        this.aqueductButton.setFillStyle(CONFIG.COLORS.buttonBgHover);
      }
    });
    
    this.aqueductButton.on('pointerout', () => {
      this.aqueductButton.setFillStyle(CONFIG.COLORS.buttonBg);
    });
    
    // Probe Beam button (Alien - player can use too for testing, but mainly AI)
    const probeX = safeRight - buttonSize / 2 - buttonSize - spacing;
    const probeY = safeTop + 90;
    
    this.probeButton = this.add.rectangle(probeX, probeY, buttonSize, buttonSize, 0x4A148C);
    this.probeButton.setInteractive({ useHandCursor: true });
    this.probeButton.setStrokeStyle(3, CONFIG.COLORS.probeBeam);
    this.probeButton.setScrollFactor(0);
    this.probeButton.setDepth(100);
    
    const probeIcon = this.add.text(probeX, probeY - 10, '👽', {
      fontSize: '32px',
    });
    probeIcon.setOrigin(0.5);
    probeIcon.setScrollFactor(0);
    probeIcon.setDepth(100);
    
    const probeLabel = this.add.text(probeX, probeY + 20, 'PB', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: CONFIG.COLORS.probeBeam,
    });
    probeLabel.setOrigin(0.5);
    probeLabel.setScrollFactor(0);
    probeLabel.setDepth(100);
    
    const probeCost = this.add.text(probeX, probeY + 35, 'FREE', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: CONFIG.COLORS.probeBeam,
    });
    probeCost.setOrigin(0.5);
    probeCost.setScrollFactor(0);
    probeCost.setDepth(100);
    
    this.probeCooldownOverlay = this.add.rectangle(probeX, probeY, buttonSize, buttonSize, CONFIG.COLORS.cooldownOverlay, 0.7);
    this.probeCooldownOverlay.setScrollFactor(0);
    this.probeCooldownOverlay.setDepth(101);
    this.probeCooldownOverlay.setVisible(false);
    
    this.probeCooldownBar = this.add.rectangle(probeX, probeY + buttonSize / 2 - 5, buttonSize, 8, CONFIG.COLORS.probeBeam);
    this.probeCooldownBar.setScrollFactor(0);
    this.probeCooldownBar.setDepth(102);
    this.probeCooldownBar.setVisible(false);
    
    this.probeButton.on('pointerdown', () => {
      this.activateProbeBeam();
    });
    
    this.probeButton.on('pointerover', () => {
      if (this.probeBeamCooldown <= 0) {
        this.probeButton.setFillStyle(0x6A1B9A);
      }
    });
    
    this.probeButton.on('pointerout', () => {
      this.probeButton.setFillStyle(0x4A148C);
    });
    
    // Roman Spell Buttons (below unit buttons)
    const spellButtonSize = 70;
    const spellSpacing = 10;
    const spellStartY = safeTop + 200;  // Below unit training buttons
    
    // Calculate center position for 3 spell buttons
    const totalSpellWidth = (spellButtonSize * 3) + (spellSpacing * 2);
    const spellStartX = width / 2 - totalSpellWidth / 2;
    
    // Shield Wall button
    const shieldX = spellStartX + spellButtonSize / 2;
    this.shieldButton = this.add.rectangle(shieldX, spellStartY, spellButtonSize, spellButtonSize, CONFIG.COLORS.spellButton);
    this.shieldButton.setInteractive({ useHandCursor: true });
    this.shieldButton.setStrokeStyle(3, CONFIG.COLORS.shieldGold);
    this.shieldButton.setScrollFactor(0);
    this.shieldButton.setDepth(100);
    
    const shieldIcon = this.add.text(shieldX, spellStartY - 12, '🛡️', { fontSize: '28px' });
    shieldIcon.setOrigin(0.5);
    shieldIcon.setScrollFactor(0);
    shieldIcon.setDepth(100);
    
    const shieldCost = this.add.text(shieldX, spellStartY + 22, '30', {
      fontSize: '12px',
      fontFamily: 'Press Start 2P',
      color: '#00FFFF',
    });
    shieldCost.setOrigin(0.5);
    shieldCost.setScrollFactor(0);
    shieldCost.setDepth(100);
    
    this.shieldCooldownOverlay = this.add.circle(shieldX, spellStartY, spellButtonSize / 2, CONFIG.COLORS.cooldownOverlay, 0.7);
    this.shieldCooldownOverlay.setScrollFactor(0);
    this.shieldCooldownOverlay.setDepth(101);
    this.shieldCooldownOverlay.setVisible(false);
    
    this.shieldButton.on('pointerdown', () => {
      this.selectSpell('shieldWall');
    });
    
    this.shieldButton.on('pointerover', () => {
      if (this.mana >= CONFIG.SHIELD_WALL.cost && this.spellCooldowns.shieldWall <= 0) {
        this.shieldButton.setFillStyle(0xA52A2A);
      }
    });
    
    this.shieldButton.on('pointerout', () => {
      this.shieldButton.setFillStyle(CONFIG.COLORS.spellButton);
    });
    
    // Rain of Pila button
    const rainX = spellStartX + spellButtonSize / 2 + spellButtonSize + spellSpacing;
    this.rainButton = this.add.rectangle(rainX, spellStartY, spellButtonSize, spellButtonSize, CONFIG.COLORS.spellButton);
    this.rainButton.setInteractive({ useHandCursor: true });
    this.rainButton.setStrokeStyle(3, 0xFFAA00);
    this.rainButton.setScrollFactor(0);
    this.rainButton.setDepth(100);
    
    const rainIcon = this.add.text(rainX, spellStartY - 12, '⚔️', { fontSize: '28px' });
    rainIcon.setOrigin(0.5);
    rainIcon.setScrollFactor(0);
    rainIcon.setDepth(100);
    
    const rainCost = this.add.text(rainX, spellStartY + 22, '50', {
      fontSize: '12px',
      fontFamily: 'Press Start 2P',
      color: '#00FFFF',
    });
    rainCost.setOrigin(0.5);
    rainCost.setScrollFactor(0);
    rainCost.setDepth(100);
    
    this.rainCooldownOverlay = this.add.circle(rainX, spellStartY, spellButtonSize / 2, CONFIG.COLORS.cooldownOverlay, 0.7);
    this.rainCooldownOverlay.setScrollFactor(0);
    this.rainCooldownOverlay.setDepth(101);
    this.rainCooldownOverlay.setVisible(false);
    
    this.rainButton.on('pointerdown', () => {
      this.selectSpell('rainOfPila');
    });
    
    this.rainButton.on('pointerover', () => {
      if (this.mana >= CONFIG.RAIN_OF_PILA.cost && this.spellCooldowns.rainOfPila <= 0) {
        this.rainButton.setFillStyle(0xA52A2A);
      }
    });
    
    this.rainButton.on('pointerout', () => {
      this.rainButton.setFillStyle(CONFIG.COLORS.spellButton);
    });
    
    // Healing Spring button
    const healX = spellStartX + spellButtonSize / 2 + (spellButtonSize + spellSpacing) * 2;
    this.healButton = this.add.rectangle(healX, spellStartY, spellButtonSize, spellButtonSize, CONFIG.COLORS.spellButton);
    this.healButton.setInteractive({ useHandCursor: true });
    this.healButton.setStrokeStyle(3, CONFIG.COLORS.healingBlue);
    this.healButton.setScrollFactor(0);
    this.healButton.setDepth(100);
    
    const healIcon = this.add.text(healX, spellStartY - 12, '💧', { fontSize: '28px' });
    healIcon.setOrigin(0.5);
    healIcon.setScrollFactor(0);
    healIcon.setDepth(100);
    
    const healCost = this.add.text(healX, spellStartY + 22, '40', {
      fontSize: '12px',
      fontFamily: 'Press Start 2P',
      color: '#00FFFF',
    });
    healCost.setOrigin(0.5);
    healCost.setScrollFactor(0);
    healCost.setDepth(100);
    
    this.healCooldownOverlay = this.add.circle(healX, spellStartY, spellButtonSize / 2, CONFIG.COLORS.cooldownOverlay, 0.7);
    this.healCooldownOverlay.setScrollFactor(0);
    this.healCooldownOverlay.setDepth(101);
    this.healCooldownOverlay.setVisible(false);
    
    this.healButton.on('pointerdown', () => {
      this.selectSpell('healingSpring');
    });
    
    this.healButton.on('pointerover', () => {
      if (this.mana >= CONFIG.HEALING_SPRING.cost && this.spellCooldowns.healingSpring <= 0) {
        this.healButton.setFillStyle(0xA52A2A);
      }
    });
    
    this.healButton.on('pointerout', () => {
      this.healButton.setFillStyle(CONFIG.COLORS.spellButton);
    });
    
    // Store references
    this.specialButtons = {
      aqueductButton: this.aqueductButton,
      aqueductIcon,
      aqueductLabel,
      aqueductCost,
      probeButton: this.probeButton,
      probeIcon,
      probeLabel,
      probeCost,
    };
    
    this.spellButtons = {
      shieldButton: this.shieldButton,
      shieldIcon,
      shieldCost,
      shieldCooldownOverlay: this.shieldCooldownOverlay,
      rainButton: this.rainButton,
      rainIcon,
      rainCost,
      rainCooldownOverlay: this.rainCooldownOverlay,
      healButton: this.healButton,
      healIcon,
      healCost,
      healCooldownOverlay: this.healCooldownOverlay,
    };
    
    // Upgrade Buttons (below spell buttons)
    this.createUpgradeButtons();
  }
  
  createUpgradeButtons() {
    const { width, height } = this.scale;
    const safeTop = height * CONFIG.SAFE_AREA.top;
    
    const upgradeButtonSize = 60;
    const upgradeSpacing = 8;
    const upgradeStartY = safeTop + 290;  // Below spell buttons
    
    // Roman Upgrades (2 buttons)
    const romanUpgradeWidth = (upgradeButtonSize * 2) + upgradeSpacing;
    const romanStartX = width / 2 - romanUpgradeWidth - 20;  // Left of center
    
    // Armor Upgrade
    const armorX = romanStartX + upgradeButtonSize / 2;
    this.armorButton = this.add.rectangle(armorX, upgradeStartY, upgradeButtonSize, upgradeButtonSize, 0x4169E1);
    this.armorButton.setInteractive({ useHandCursor: true });
    this.armorButton.setStrokeStyle(2, 0xFFD700);
    this.armorButton.setScrollFactor(0);
    this.armorButton.setDepth(100);
    
    const armorIcon = this.add.text(armorX, upgradeStartY - 8, '🛡️', { fontSize: '24px' });
    armorIcon.setOrigin(0.5);
    armorIcon.setScrollFactor(0);
    armorIcon.setDepth(100);
    
    const armorCost = this.add.text(armorX, upgradeStartY + 18, '200', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    armorCost.setOrigin(0.5);
    armorCost.setScrollFactor(0);
    armorCost.setDepth(100);
    
    this.armorButton.on('pointerdown', () => {
      this.purchaseUpgrade('roman', 'armor');
    });
    
    // Weapon Upgrade
    const weaponX = romanStartX + upgradeButtonSize / 2 + upgradeButtonSize + upgradeSpacing;
    this.weaponButton = this.add.rectangle(weaponX, upgradeStartY, upgradeButtonSize, upgradeButtonSize, 0xDC143C);
    this.weaponButton.setInteractive({ useHandCursor: true });
    this.weaponButton.setStrokeStyle(2, 0xFFD700);
    this.weaponButton.setScrollFactor(0);
    this.weaponButton.setDepth(100);
    
    const weaponIcon = this.add.text(weaponX, upgradeStartY - 8, '⚔️', { fontSize: '24px' });
    weaponIcon.setOrigin(0.5);
    weaponIcon.setScrollFactor(0);
    weaponIcon.setDepth(100);
    
    const weaponCost = this.add.text(weaponX, upgradeStartY + 18, '200', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
    });
    weaponCost.setOrigin(0.5);
    weaponCost.setScrollFactor(0);
    weaponCost.setDepth(100);
    
    this.weaponButton.on('pointerdown', () => {
      this.purchaseUpgrade('roman', 'weapon');
    });
    
    // Alien Upgrades (4 buttons) - right of center
    const alienUpgradeWidth = (upgradeButtonSize * 4) + (upgradeSpacing * 3);
    const alienStartX = width / 2 + 20;  // Right of center
    
    // Cloning Vats
    const cloningX = alienStartX + upgradeButtonSize / 2;
    this.cloningButton = this.add.rectangle(cloningX, upgradeStartY, upgradeButtonSize, upgradeButtonSize, 0x9C27B0);
    this.cloningButton.setInteractive({ useHandCursor: true });
    this.cloningButton.setStrokeStyle(2, 0x00FF00);
    this.cloningButton.setScrollFactor(0);
    this.cloningButton.setDepth(100);
    
    const cloningIcon = this.add.text(cloningX, upgradeStartY - 8, '⏱️', { fontSize: '20px' });
    cloningIcon.setOrigin(0.5);
    cloningIcon.setScrollFactor(0);
    cloningIcon.setDepth(100);
    
    const cloningCost = this.add.text(cloningX, upgradeStartY + 18, '150', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#00FF00',
    });
    cloningCost.setOrigin(0.5);
    cloningCost.setScrollFactor(0);
    cloningCost.setDepth(100);
    
    this.cloningButton.on('pointerdown', () => {
      this.purchaseUpgrade('alien', 'cloningVats');
    });
    
    // Plasma Infusion
    const plasmaX = cloningX + upgradeButtonSize + upgradeSpacing;
    this.plasmaButton = this.add.rectangle(plasmaX, upgradeStartY, upgradeButtonSize, upgradeButtonSize, 0x39FF14);
    this.plasmaButton.setInteractive({ useHandCursor: true });
    this.plasmaButton.setStrokeStyle(2, 0x00FF00);
    this.plasmaButton.setScrollFactor(0);
    this.plasmaButton.setDepth(100);
    
    const plasmaIcon = this.add.text(plasmaX, upgradeStartY - 8, '⚡', { fontSize: '24px' });
    plasmaIcon.setOrigin(0.5);
    plasmaIcon.setScrollFactor(0);
    plasmaIcon.setDepth(100);
    
    const plasmaCost = this.add.text(plasmaX, upgradeStartY + 18, '200', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#00FF00',
    });
    plasmaCost.setOrigin(0.5);
    plasmaCost.setScrollFactor(0);
    plasmaCost.setDepth(100);
    
    this.plasmaButton.on('pointerdown', () => {
      this.purchaseUpgrade('alien', 'plasmaInfusion');
    });
    
    // Exoskeleton
    const exoX = plasmaX + upgradeButtonSize + upgradeSpacing;
    this.exoButton = this.add.rectangle(exoX, upgradeStartY, upgradeButtonSize, upgradeButtonSize, 0x4A148C);
    this.exoButton.setInteractive({ useHandCursor: true });
    this.exoButton.setStrokeStyle(2, 0x00FF00);
    this.exoButton.setScrollFactor(0);
    this.exoButton.setDepth(100);
    
    const exoIcon = this.add.text(exoX, upgradeStartY - 8, '🦾', { fontSize: '20px' });
    exoIcon.setOrigin(0.5);
    exoIcon.setScrollFactor(0);
    exoIcon.setDepth(100);
    
    const exoCost = this.add.text(exoX, upgradeStartY + 18, '200', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#00FF00',
    });
    exoCost.setOrigin(0.5);
    exoCost.setScrollFactor(0);
    exoCost.setDepth(100);
    
    this.exoButton.on('pointerdown', () => {
      this.purchaseUpgrade('alien', 'exoskeleton');
    });
    
    // Warp Drive
    const warpX = exoX + upgradeButtonSize + upgradeSpacing;
    this.warpButton = this.add.rectangle(warpX, upgradeStartY, upgradeButtonSize, upgradeButtonSize, 0x6A1B9A);
    this.warpButton.setInteractive({ useHandCursor: true });
    this.warpButton.setStrokeStyle(2, 0x00FF00);
    this.warpButton.setScrollFactor(0);
    this.warpButton.setDepth(100);
    
    const warpIcon = this.add.text(warpX, upgradeStartY - 8, '🚀', { fontSize: '20px' });
    warpIcon.setOrigin(0.5);
    warpIcon.setScrollFactor(0);
    warpIcon.setDepth(100);
    
    const warpCost = this.add.text(warpX, upgradeStartY + 18, '175', {
      fontSize: '10px',
      fontFamily: 'Press Start 2P',
      color: '#00FF00',
    });
    warpCost.setOrigin(0.5);
    warpCost.setScrollFactor(0);
    warpCost.setDepth(100);
    
    this.warpButton.on('pointerdown', () => {
      this.purchaseUpgrade('alien', 'warpDrive');
    });
    
    // Store references
    this.upgradeButtons = {
      // Roman
      armorButton: this.armorButton,
      armorIcon,
      armorCost,
      weaponButton: this.weaponButton,
      weaponIcon,
      weaponCost,
      // Alien
      cloningButton: this.cloningButton,
      cloningIcon,
      cloningCost,
      plasmaButton: this.plasmaButton,
      plasmaIcon,
      plasmaCost,
      exoButton: this.exoButton,
      exoIcon,
      exoCost,
      warpButton: this.warpButton,
      warpIcon,
      warpCost,
    };
  }
  
  createControlButtons() {
    const { width, height } = this.scale;
    const safeTop = height * CONFIG.SAFE_AREA.top;
    const safeRight = width - (width * CONFIG.SAFE_AREA.right);
    
    const buttonSize = 50;
    const spacing = 10;
    
    // Speed toggle button (1x/2x/3x)
    const speedX = safeRight - buttonSize / 2;
    const speedY = safeTop + 220;
    
    this.speedButton = this.add.rectangle(speedX, speedY, buttonSize, buttonSize, 0x4CAF50);
    this.speedButton.setInteractive({ useHandCursor: true });
    this.speedButton.setStrokeStyle(2, 0xFFFFFF);
    this.speedButton.setScrollFactor(0);
    this.speedButton.setDepth(100);
    
    this.speedText = this.add.text(speedX, speedY, '1x', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    this.speedText.setOrigin(0.5);
    this.speedText.setScrollFactor(0);
    this.speedText.setDepth(100);
    
    this.speedButton.on('pointerdown', () => {
      this.toggleSpeed();
    });
    
    this.speedButton.on('pointerover', () => {
      this.speedButton.setFillStyle(0x66BB6A);
    });
    
    this.speedButton.on('pointerout', () => {
      this.speedButton.setFillStyle(0x4CAF50);
    });
    
    // Pause button
    const pauseX = safeRight - buttonSize / 2;
    const pauseY = speedY + buttonSize + spacing;
    
    this.pauseButton = this.add.rectangle(pauseX, pauseY, buttonSize, buttonSize, 0xFFA500);
    this.pauseButton.setInteractive({ useHandCursor: true });
    this.pauseButton.setStrokeStyle(2, 0xFFFFFF);
    this.pauseButton.setScrollFactor(0);
    this.pauseButton.setDepth(100);
    
    this.pauseIcon = this.add.text(pauseX, pauseY, '⏸', {
      fontSize: '24px',
    });
    this.pauseIcon.setOrigin(0.5);
    this.pauseIcon.setScrollFactor(0);
    this.pauseIcon.setDepth(100);
    
    this.pauseButton.on('pointerdown', () => {
      this.togglePause();
    });
    
    this.pauseButton.on('pointerover', () => {
      this.pauseButton.setFillStyle(0xFFB733);
    });
    
    this.pauseButton.on('pointerout', () => {
      this.pauseButton.setFillStyle(0xFFA500);
    });
    
    // Menu button
    const menuX = safeRight - buttonSize / 2;
    const menuY = pauseY + buttonSize + spacing;
    
    this.menuButton = this.add.rectangle(menuX, menuY, buttonSize, buttonSize, 0x2196F3);
    this.menuButton.setInteractive({ useHandCursor: true });
    this.menuButton.setStrokeStyle(2, 0xFFFFFF);
    this.menuButton.setScrollFactor(0);
    this.menuButton.setDepth(100);
    
    this.menuIcon = this.add.text(menuX, menuY, '☰', {
      fontSize: '28px',
      color: '#FFFFFF',
    });
    this.menuIcon.setOrigin(0.5);
    this.menuIcon.setScrollFactor(0);
    this.menuIcon.setDepth(100);
    
    this.menuButton.on('pointerdown', () => {
      this.openMenu();
    });
    
    this.menuButton.on('pointerover', () => {
      this.menuButton.setFillStyle(0x42A5F5);
    });
    
    this.menuButton.on('pointerout', () => {
      this.menuButton.setFillStyle(0x2196F3);
    });
    
    // Store references
    this.controlButtons = {
      speedButton: this.speedButton,
      speedText: this.speedText,
      pauseButton: this.pauseButton,
      pauseIcon: this.pauseIcon,
      menuButton: this.menuButton,
      menuIcon: this.menuIcon,
    };
  }
  
  toggleSpeed() {
    // Cycle through 1x -> 2x -> 3x -> 4x -> 5x -> 10x -> 20x -> 1x
    const speedLevels = [1, 2, 3, 4, 5, 10, 20];
    const currentIndex = speedLevels.indexOf(this.gameSpeed);
    const nextIndex = (currentIndex + 1) % speedLevels.length;
    this.gameSpeed = speedLevels[nextIndex];
    
    this.speedText.setText(`${this.gameSpeed}x`);
    
    // Apply speed to multiple Phaser systems for proper acceleration
    this.physics.world.timeScale = 1; // Keep physics at normal speed
    this.time.timeScale = this.gameSpeed; // Scale time events (delays, timers)
    this.tweens.timeScale = this.gameSpeed; // Scale tweens/animations
    this.anims.globalTimeScale = this.gameSpeed; // Scale sprite animations
    this.game.loop.timeScale = this.gameSpeed; // Scale game loop delta
    
    // Show notification for higher speeds
    if (this.gameSpeed >= 10) {
      const { width } = this.scale;
      const notification = this.add.text(width / 2, 150, `TURBO: ${this.gameSpeed}x SPEED!`, {
        fontSize: '20px',
        fontFamily: 'Press Start 2P',
        color: '#FF4444',
        stroke: '#000000',
        strokeThickness: 4,
      });
      notification.setOrigin(0.5);
      notification.setScrollFactor(0);
      notification.setDepth(1000);
      
      // Pulse and fade out
      this.tweens.add({
        targets: notification,
        scale: 1.2,
        duration: 200,
        yoyo: true,
        repeat: 2,
      });
      
      this.tweens.add({
        targets: notification,
        alpha: 0,
        duration: 1000,
        delay: 1200,
        onComplete: () => notification.destroy()
      });
    }
  }
  
  togglePause() {
    if (this.scene.isPaused()) {
      this.scene.resume();
      this.pauseIcon.setText('⏸');
    } else {
      this.scene.pause();
      this.pauseIcon.setText('▶');
    }
  }
  
  openMenu() {
    // Pause game and show menu overlay
    this.scene.pause();
    this.scene.launch('PauseMenuScene');
  }
  
  skipTutorial() {
    // Clear all tutorial elements
    if (this.tutorialArrows) {
      this.tutorialArrows.forEach(element => {
        if (element.destroy) element.destroy();
      });
      this.tutorialArrows = null;
    }
    
    // Mark tutorial as complete
    this.tutorialPhase = 'complete';
    this.campaignComplete = true;
    
    // Clear tutorial references
    this.tutorialOverlay = null;
    this.tutorialButtonGlow = null;
    this.tutorialMessageText = null;
    this.tutorialPointerHand = null;
    this.tutorialArrow = null;
    this.tutorialProgressText = null;
    this.tutorialHighlight1 = null;
    this.tutorialHighlight2 = null;
    this.tutorialClickText = null;
    this.tutorialClickTextBg = null;
  }
  
  createTooltip() {
    // Tooltip container
    this.tooltipBg = this.add.rectangle(0, 0, 250, 100, 0x1A1A2E, 0.95);
    this.tooltipBg.setStrokeStyle(2, 0xFFD700);
    this.tooltipBg.setScrollFactor(0);
    this.tooltipBg.setDepth(200);
    this.tooltipBg.setVisible(false);
    
    this.tooltipText = this.add.text(0, 0, '', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      align: 'left',
      wordWrap: { width: 230 },
      lineSpacing: 2,
    });
    this.tooltipText.setScrollFactor(0);
    this.tooltipText.setDepth(201);
    this.tooltipText.setVisible(false);
  }
  
  showTooltip(x, y, text) {
    if (!this.tooltipBg || !this.tooltipText) return;
    
    this.tooltipText.setText(text);
    
    // Calculate size based on text
    const bounds = this.tooltipText.getBounds();
    const padding = 10;
    const width = Math.min(250, bounds.width + padding * 2);
    const height = bounds.height + padding * 2;
    
    this.tooltipBg.setSize(width, height);
    
    // Position tooltip (keep on screen)
    const screenWidth = this.scale.width;
    let tooltipX = x;
    let tooltipY = y + 10;
    
    // Keep tooltip on screen horizontally
    if (tooltipX + width / 2 > screenWidth - 10) {
      tooltipX = screenWidth - width / 2 - 10;
    }
    if (tooltipX - width / 2 < 10) {
      tooltipX = width / 2 + 10;
    }
    
    this.tooltipBg.setPosition(tooltipX, tooltipY + height / 2);
    this.tooltipText.setPosition(tooltipX - width / 2 + padding, tooltipY + padding);
    
    this.tooltipBg.setVisible(true);
    this.tooltipText.setVisible(true);
  }
  
  hideTooltip() {
    if (this.tooltipBg) this.tooltipBg.setVisible(false);
    if (this.tooltipText) this.tooltipText.setVisible(false);
  }
  
  getUnitTooltipText(key, config) {
    const names = {
      worker: 'Worker',
      legionary: 'Legionary',
      pilum: 'Pilum Thrower',
      centurion: 'Centurion',
    };
    
    const descriptions = {
      worker: 'Gathers gold from mines.\nBasic economic unit.',
      legionary: 'Melee infantry unit.\nBalanced stats.',
      pilum: 'Ranged javelin thrower.\nAttacks from distance.',
      centurion: 'Elite heavy infantry.\nHigh health and damage.',
    };
    
    let text = `${names[key] || key.toUpperCase()}\n`;
    text += `${descriptions[key] || ''}\n\n`;
    text += `Cost: ${config.cost} gold\n`;
    text += `HP: ${config.health}\n`;
    text += `Damage: ${config.damage}\n`;
    text += `Speed: ${config.speed}\n`;
    text += `Range: ${config.range}\n`;
    text += `Cooldown: ${(config.cooldown / 1000).toFixed(1)}s`;
    
    return text;
  }
  
  getSpellTooltipText(spellKey) {
    return this.spellSystem.getTooltipText(spellKey);
  }
  
  getUpgradeTooltipText(faction, upgradeKey) {
    const upgrades = {
      roman: {
        armor: {
          name: 'Armor Upgrade',
          desc: 'Reinforced armor and shields.\n+20% HP for all units.',
          cost: 200,
        },
        weapon: {
          name: 'Weapon Upgrade',
          desc: 'Sharper weapons and better training.\n+20% damage for all units.',
          cost: 200,
        },
      },
      alien: {
        cloningVats: {
          name: 'Cloning Vats',
          desc: 'Accelerated cloning technology.\n-25% training time for all units.',
          cost: 150,
        },
        plasmaInfusion: {
          name: 'Plasma Infusion',
          desc: 'Enhanced plasma weaponry.\n+20% damage for all units.',
          cost: 200,
        },
        exoskeleton: {
          name: 'Exoskeleton',
          desc: 'Reinforced bio-armor.\n+20% HP for all units.',
          cost: 200,
        },
        warpDrive: {
          name: 'Warp Drive',
          desc: 'Quantum acceleration tech.\n+15% movement speed.',
          cost: 175,
        },
      },
    };
    
    const upgrade = upgrades[faction]?.[upgradeKey];
    if (!upgrade) return '';
    
    const purchased = faction === 'roman' ? this.romanUpgrades[upgradeKey] : this.alienUpgrades[upgradeKey];
    
    let text = `${upgrade.name}\n`;
    text += `${upgrade.desc}\n\n`;
    text += `Cost: ${upgrade.cost} gold\n`;
    text += `One-time purchase\n`;
    text += purchased ? 'STATUS: PURCHASED ✓' : 'Click to purchase';
    
    return text;
  }
  
  getAqueductTooltipText() {
    if (this.aqueductButtonState === 'build') {
      return 'Roman Aqueduct\nGenerates +2 mana per second.\nMulti-arch stone structure.\n\nCost: 100 gold\nClick to build';
    } else if (this.aqueductButtonState === 'upgrade') {
      return 'Upgrade Aqueduct\nIncreases mana generation.\n+4 mana per second (total).\n\nCost: 150 gold\nClick to upgrade';
    } else {
      return 'Roman Aqueduct\nFully upgraded!\nGenerating +4 mana/sec.\n\nNo further upgrades available';
    }
  }
  
  showManaGainText(x, y, amount) {
    const manaText = this.add.text(x, y, `+${Math.floor(amount)}`, {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#BB86FC',
      stroke: '#000000',
      strokeThickness: 4,
    });
    manaText.setOrigin(0.5);
    manaText.setDepth(1000);
    
    this.tweens.add({
      targets: manaText,
      y: manaText.y - 60,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        manaText.destroy();
      }
    });
  }
  
  showScoutDetectedNotification() {
    // Show warning notification to player
    const { width } = this.scale;
    
    const warningBox = this.add.rectangle(width / 2, 200, 400, 60, 0xFF4444, 0.9);
    warningBox.setStrokeStyle(3, 0xFF0000);
    warningBox.setScrollFactor(0);
    warningBox.setDepth(1000);
    
    const warningText = this.add.text(width / 2, 200, '⚠️ ENEMY SCOUT DETECTED! ⚠️', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
    });
    warningText.setOrigin(0.5);
    warningText.setScrollFactor(0);
    warningText.setDepth(1001);
    
    // Pulse animation
    this.tweens.add({
      targets: [warningBox, warningText],
      scale: 1.05,
      duration: 300,
      yoyo: true,
      repeat: 2,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Fade out
        this.tweens.add({
          targets: [warningBox, warningText],
          alpha: 0,
          duration: 500,
          delay: 1000,
          onComplete: () => {
            warningBox.destroy();
            warningText.destroy();
          }
        });
      }
    });
  }
  
  purchaseUpgrade(faction, upgradeKey) {
    const upgrades = faction === 'roman' ? this.romanUpgrades : this.alienUpgrades;
    const config = faction === 'roman' ? CONFIG.ROMAN_UPGRADES[upgradeKey] : CONFIG.ALIEN_UPGRADES[upgradeKey];
    
    // Check if already purchased
    if (upgrades[upgradeKey]) return;
    
    // Check if can afford
    const goldSource = faction === 'roman' ? 'gold' : 'enemyGold';
    if (this[goldSource] < config.cost) return;
    
    // Deduct cost
    this[goldSource] -= config.cost;
    
    // Mark as purchased
    upgrades[upgradeKey] = true;
    
    // Apply bonuses to all existing units
    const units = faction === 'roman' ? this.playerUnits : this.enemyUnits;
    units.forEach(unit => {
      this.applyUpgradeBonuses(unit, faction);
    });
    
    // Update button to show checkmark (handled in updateButtonStates)
    // The checkmark visibility is toggled based on the upgrade state
  }
  
  applyUpgradeBonuses(unit, faction) {
    if (faction === 'roman') {
      // Armor Upgrade: +20% HP
      if (this.romanUpgrades.armor) {
        const hpBonus = CONFIG.ROMAN_UPGRADES.armor.hpBonus;
        if (!unit.armorApplied) {
          unit.maxHealth = Math.floor(unit.maxHealth * (1 + hpBonus));
          unit.health = Math.floor(unit.health * (1 + hpBonus));
          unit.armorApplied = true;
        }
      }
      
      // Weapon Upgrade: +20% attack
      if (this.romanUpgrades.weapon) {
        const damageBonus = CONFIG.ROMAN_UPGRADES.weapon.damageBonus;
        if (!unit.weaponApplied) {
          unit.damage = Math.floor(unit.damage * (1 + damageBonus));
          unit.weaponApplied = true;
        }
      }
    } else {
      // Exoskeleton: +20% HP
      if (this.alienUpgrades.exoskeleton) {
        const hpBonus = CONFIG.ALIEN_UPGRADES.exoskeleton.hpBonus;
        if (!unit.exoApplied) {
          unit.maxHealth = Math.floor(unit.maxHealth * (1 + hpBonus));
          unit.health = Math.floor(unit.health * (1 + hpBonus));
          unit.exoApplied = true;
        }
      }
      
      // Plasma Infusion: +20% attack
      if (this.alienUpgrades.plasmaInfusion) {
        const damageBonus = CONFIG.ALIEN_UPGRADES.plasmaInfusion.damageBonus;
        if (!unit.plasmaApplied) {
          unit.damage = Math.floor(unit.damage * (1 + damageBonus));
          unit.plasmaApplied = true;
        }
      }
      
      // Warp Drive: +15% speed
      if (this.alienUpgrades.warpDrive) {
        const speedBonus = CONFIG.ALIEN_UPGRADES.warpDrive.speedBonus;
        if (!unit.warpApplied) {
          unit.speed = Math.floor(unit.speed * (1 + speedBonus));
          unit.warpApplied = true;
        }
      }
    }
  }
  
  buildAqueduct() {
    if (this.aqueduct || !this.canAfford(CONFIG.AQUEDUCT_COST)) return;
    
    this.gold -= CONFIG.AQUEDUCT_COST;
    
    // Build aqueduct to the RIGHT of the Roman base (clearly visible)
    this.aqueduct = new Aqueduct(
      this,
      CONFIG.PLAYER_BASE_X + 150,  // Position to the right of the base
      this.groundY - 100  // Same height as base, slightly elevated
    );
    this.aqueduct.setDepth(5);  // In front of the base and units
    
    // Update button state (icon/cost updated in updateButtonStates)
    this.aqueductButtonState = 'upgrade';
  }
  
  upgradeAqueduct() {
    if (!this.aqueduct || this.aqueduct.isUpgraded || !this.canAfford(CONFIG.AQUEDUCT_UPGRADE_COST)) return;
    
    this.gold -= CONFIG.AQUEDUCT_UPGRADE_COST;
    this.aqueduct.upgrade();
    
    // Update button state (icon/cost updated in updateButtonStates)
    this.aqueductButtonState = 'upgraded';
  }
  
  activateProbeBeam() {
    if (this.probeBeamCooldown > 0 || this.probeBeamActive) return;
    
    // Enter probe beam selection mode
    this.probeBeamActive = true;
    
    // Highlight enemy units (for player, they can target their own units for testing)
    // In practice, this would be for aliens only
    this.input.once('pointerdown', (pointer) => {
      const worldX = pointer.x + this.cameras.main.scrollX;
      const worldY = pointer.y;
      
      // Find clicked unit
      let targetUnit = null;
      
      // For now, let player test on their own units
      // In real game, aliens would use this on their units
      [...this.playerUnits, ...this.enemyUnits].forEach(unit => {
        if (unit.isDead) return;
        const dist = Phaser.Math.Distance.Between(worldX, worldY, unit.x, unit.y);
        if (dist < 50) {
          targetUnit = unit;
        }
      });
      
      if (targetUnit) {
        this.executeProbeBeam(targetUnit);
      }
      
      this.probeBeamActive = false;
    });
  }
  
  selectSpell(spellName) {
    // Check if we can cast the spell
    let spellConfig;
    if (spellName === 'shieldWall') {
      spellConfig = CONFIG.SHIELD_WALL;
    } else if (spellName === 'rainOfPila') {
      spellConfig = CONFIG.RAIN_OF_PILA;
    } else if (spellName === 'healingSpring') {
      spellConfig = CONFIG.HEALING_SPRING;
    }
    
    if (!spellConfig) return;
    if (this.mana < spellConfig.cost) return;
    if (this.spellCooldowns[spellName] > 0) return;
    
    // Set active spell
    this.activeSpell = spellName;
    
    // Highlight the selected button (if it exists)
    if (spellName === 'shieldWall' && this.shieldButton) {
      this.shieldButton.setFillStyle(0xFF0000);
    } else if (spellName === 'rainOfPila' && this.rainButton) {
      this.rainButton.setFillStyle(0xFF0000);
    } else if (spellName === 'healingSpring' && this.healButton) {
      this.healButton.setFillStyle(0xFF0000);
    }
    
    // Wait for battlefield click
    this.input.once('pointerdown', (pointer) => {
      // Convert screen to world coordinates
      const worldX = pointer.x + this.cameras.main.scrollX;
      const worldY = pointer.y;
      
      // Cast spell at location
      this.castSpell(spellName, worldX, worldY);
      
      // Reset button color (if it exists)
      if (spellName === 'shieldWall' && this.shieldButton) {
        this.shieldButton.setFillStyle(CONFIG.COLORS.spellButton);
      } else if (spellName === 'rainOfPila' && this.rainButton) {
        this.rainButton.setFillStyle(CONFIG.COLORS.spellButton);
      } else if (spellName === 'healingSpring' && this.healButton) {
        this.healButton.setFillStyle(CONFIG.COLORS.spellButton);
      }
      
      this.activeSpell = null;
    });
  }
  
  castSpell(spellName, x, y) {
    let spellConfig;
    
    if (spellName === 'shieldWall') {
      spellConfig = CONFIG.SHIELD_WALL;
      this.castShieldWall(x, y);
    } else if (spellName === 'rainOfPila') {
      spellConfig = CONFIG.RAIN_OF_PILA;
      this.castRainOfPila(x, y);
    } else if (spellName === 'healingSpring') {
      spellConfig = CONFIG.HEALING_SPRING;
      this.castHealingSpring(x, y);
    }
    
    // Track stat
    this.stats.spellsCast++;
    
    // Deduct mana and start cooldown
    this.mana -= spellConfig.cost;
    this.spellCooldowns[spellName] = spellConfig.cooldown;
  }
  
  castShieldWall(x, y) {
    const config = CONFIG.SHIELD_WALL;
    
    // Track spell cast for campaign
    if (this.campaignObjective === 'cast_spells') {
      this.spellsCastThisLevel.boost = true;
    }
    
    // Play shield/buff spell sound
    soundEffects.playSpellCast();
    
    // Find friendly units in radius
    const affectedUnits = this.playerUnits.filter(unit => {
      if (unit.isDead) return false;
      const dist = Phaser.Math.Distance.Between(x, y, unit.x, unit.y);
      return dist <= config.radius;
    });
    
    if (affectedUnits.length === 0) return;
    
    // Visual effect - golden circle
    const circle = this.add.circle(x, y, config.radius, CONFIG.COLORS.shieldGold, 0.2);
    circle.setStrokeStyle(3, CONFIG.COLORS.shieldGold);
    circle.setDepth(10);
    
    this.tweens.add({
      targets: circle,
      alpha: 0,
      duration: 500,
      onComplete: () => circle.destroy()
    });
    
    // Apply shield to units
    affectedUnits.forEach(unit => {
      // Add golden glow
      const shield = this.add.circle(0, 0, 40, CONFIG.COLORS.shieldGold, 0.3);
      shield.setStrokeStyle(3, CONFIG.COLORS.shieldGold);
      unit.add(shield);
      
      // Pulse animation
      this.tweens.add({
        targets: shield,
        scale: 1.2,
        alpha: 0.5,
        duration: 500,
        yoyo: true,
        repeat: Math.floor(config.duration / 1000) - 1,
      });
      
      // Golden sparkle particles around unit
      for (let i = 0; i < 6; i++) {
        this.time.delayedCall(i * 200, () => {
          const angle = Math.random() * Math.PI * 2;
          const dist = 30 + Math.random() * 20;
          const sparkle = this.add.circle(unit.x, unit.y, 3, CONFIG.COLORS.shieldGold);
          sparkle.setDepth(499);
          
          this.tweens.add({
            targets: sparkle,
            x: unit.x + Math.cos(angle) * dist,
            y: unit.y + Math.sin(angle) * dist - 20,
            alpha: 0,
            duration: 600,
            onComplete: () => sparkle.destroy()
          });
        });
      }
      
      // Store original damage reduction
      unit.shieldActive = true;
      
      // Remove shield after duration
      this.time.delayedCall(config.duration, () => {
        unit.shieldActive = false;
        this.tweens.add({
          targets: shield,
          alpha: 0,
          duration: 300,
          onComplete: () => shield.destroy()
        });
      });
    });
  }
  
  castRainOfPila(x, y) {
    const config = CONFIG.RAIN_OF_PILA;
    
    // Track spell cast for campaign
    if (this.campaignObjective === 'cast_spells') {
      this.spellsCastThisLevel.lightning = true;
    }
    
    // Play fireball spell sound (works well for rain of pila)
    soundEffects.playFireballSpell();
    
    // Visual effect - target circle
    const targetCircle = this.add.circle(x, y, config.radius, 0xFF0000, 0.2);
    targetCircle.setStrokeStyle(3, 0xFF0000);
    targetCircle.setDepth(10);
    
    // Spawn javelins falling from sky
    const numJavelins = 12;
    const duration = config.duration;
    const damagePerJavelin = config.damage / numJavelins;
    
    for (let i = 0; i < numJavelins; i++) {
      this.time.delayedCall((duration / numJavelins) * i, () => {
        // Random position within radius
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * config.radius;
        const javelinX = x + Math.cos(angle) * dist;
        const javelinY = y + Math.sin(angle) * dist;
        
        // Javelin visual (line falling from sky)
        const javelin = this.add.line(0, 0, 0, -100, 0, 0, 0xFFAA00, 1);
        javelin.setLineWidth(3);
        javelin.setPosition(javelinX, javelinY - 200);
        javelin.setDepth(500);
        
        // Animate falling
        this.tweens.add({
          targets: javelin,
          y: javelinY,
          duration: 300,
          ease: 'Power2',
          onComplete: () => {
            // Impact effect - dust particles
            for (let p = 0; p < 5; p++) {
              const particle = this.add.circle(javelinX, javelinY, 3, 0x8B7355);
              particle.setDepth(499);
              
              const pAngle = Math.random() * Math.PI * 2;
              const pDist = 20 + Math.random() * 30;
              
              this.tweens.add({
                targets: particle,
                x: javelinX + Math.cos(pAngle) * pDist,
                y: javelinY + Math.sin(pAngle) * pDist,
                alpha: 0,
                duration: 400,
                onComplete: () => particle.destroy()
              });
            }
            
            // Colorful impact sparkles (red, orange, yellow)
            const impactColors = [0xFF0000, 0xFF6600, 0xFFAA00, 0xFFFF00];
            for (let s = 0; s < 6; s++) {
              const color = impactColors[Math.floor(Math.random() * impactColors.length)];
              const sparkle = this.add.circle(javelinX, javelinY, 2 + Math.random() * 3, color);
              sparkle.setDepth(500);
              
              const sAngle = Math.random() * Math.PI * 2;
              const sDist = 15 + Math.random() * 25;
              
              this.tweens.add({
                targets: sparkle,
                x: javelinX + Math.cos(sAngle) * sDist,
                y: javelinY + Math.sin(sAngle) * sDist - 15,
                alpha: 0,
                duration: 300 + Math.random() * 200,
                onComplete: () => sparkle.destroy()
              });
            }
            
            // Damage enemies in small area
            this.enemyUnits.forEach(unit => {
              if (unit.isDead) return;
              const dist = Phaser.Math.Distance.Between(javelinX, javelinY, unit.x, unit.y);
              if (dist <= 40) {
                unit.takeDamage(damagePerJavelin, javelinX, javelinY);
              }
            });
            
            javelin.destroy();
          }
        });
      });
    }
    
    // Remove target circle after duration
    this.time.delayedCall(duration, () => {
      this.tweens.add({
        targets: targetCircle,
        alpha: 0,
        duration: 300,
        onComplete: () => targetCircle.destroy()
      });
    });
  }
  
  castHealingSpring(x, y) {
    const config = CONFIG.HEALING_SPRING;
    
    // Track spell cast for campaign
    if (this.campaignObjective === 'cast_spells') {
      this.spellsCastThisLevel.heal = true;
    }
    
    // Play heal spell sound
    soundEffects.playHealSpell();
    
    // Visual effect - blue-green fountain
    const fountain = this.add.circle(x, y, config.radius, CONFIG.COLORS.healingBlue, 0.2);
    fountain.setStrokeStyle(3, CONFIG.COLORS.healingBlue);
    fountain.setDepth(10);
    
    // Pulse animation
    this.tweens.add({
      targets: fountain,
      scale: 1.1,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: Math.floor(config.duration / 2000),
    });
    
    // Spawn water particles
    const particleInterval = 200;
    const numTicks = config.duration / particleInterval;
    const healPerTick = config.healAmount / numTicks;
    
    for (let i = 0; i < numTicks; i++) {
      this.time.delayedCall(particleInterval * i, () => {
        // Create water droplets
        for (let d = 0; d < 3; d++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * config.radius;
          const dropX = x + Math.cos(angle) * dist;
          const dropY = y + Math.sin(angle) * dist;
          
          const droplet = this.add.circle(dropX, dropY, 4, CONFIG.COLORS.healingBlue);
          droplet.setDepth(499);
          
          this.tweens.add({
            targets: droplet,
            y: dropY - 30,
            alpha: 0,
            duration: 600,
            onComplete: () => droplet.destroy()
          });
        }
        
        // Colorful healing sparkles (cyan, blue, turquoise)
        const healColors = [0x00FFFF, 0x00CED1, 0x40E0D0, 0x48D1CC];
        for (let s = 0; s < 4; s++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * config.radius * 0.8;
          const sparkleX = x + Math.cos(angle) * dist;
          const sparkleY = y + Math.sin(angle) * dist;
          const color = healColors[Math.floor(Math.random() * healColors.length)];
          
          const sparkle = this.add.circle(sparkleX, sparkleY, 2 + Math.random() * 2, color);
          sparkle.setDepth(500);
          
          this.tweens.add({
            targets: sparkle,
            y: sparkleY - 40,
            alpha: 0,
            duration: 800,
            onComplete: () => sparkle.destroy()
          });
        }
        
        // Heal friendly units in radius
        this.playerUnits.forEach(unit => {
          if (unit.isDead) return;
          const dist = Phaser.Math.Distance.Between(x, y, unit.x, unit.y);
          if (dist <= config.radius) {
            unit.health = Math.min(unit.maxHealth, unit.health + healPerTick);
            
            // Update health bar
            const healthPercent = unit.health / unit.maxHealth;
            this.tweens.add({
              targets: unit.healthBar,
              width: 60 * healthPercent,
              duration: 200,
            });
          }
        });
      });
    }
    
    // Remove fountain after duration
    this.time.delayedCall(config.duration, () => {
      this.tweens.add({
        targets: fountain,
        alpha: 0,
        duration: 500,
        onComplete: () => fountain.destroy()
      });
    });
  }
  
  castMindControl(targetUnit) {
    const config = CONFIG.MIND_CONTROL;
    
    if (!targetUnit || targetUnit.isDead || targetUnit.isEnemy) return;
    
    // Track mind control usage for Alien campaign L4
    if (this.campaignObjective === 'alien_mind_control') {
      this.mindControlCount++;
    }
    
    // Store original properties
    targetUnit.originalIsEnemy = targetUnit.isEnemy;
    targetUnit.mindControlled = true;
    
    // Convert to alien side temporarily
    targetUnit.isEnemy = true;
    
    // Visual effects - antenna on head
    const antenna = this.add.line(0, 0, 0, -60, 0, -80, CONFIG.COLORS.mindControl, 1);
    antenna.setLineWidth(2);
    targetUnit.add(antenna);
    
    const antennaBulb = this.add.circle(0, -80, 5, CONFIG.COLORS.mindControl);
    antennaBulb.setStrokeStyle(2, 0x00FF00);
    targetUnit.add(antennaBulb);
    
    // Pulsing antenna bulb
    this.tweens.add({
      targets: antennaBulb,
      scale: 1.5,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });
    
    // Green glowing eyes effect on sprite
    const eyeGlow = this.add.rectangle(0, -10, 30, 8, CONFIG.COLORS.mindControl, 0.8);
    targetUnit.add(eyeGlow);
    
    this.tweens.add({
      targets: eyeGlow,
      alpha: 0.4,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });
    
    // Change health bar color to purple
    targetUnit.healthBar.setFillStyle(CONFIG.COLORS.enemyHealth);
    
    // Spiral particles around unit
    for (let i = 0; i < 8; i++) {
      this.time.delayedCall(i * 100, () => {
        const particle = this.add.circle(targetUnit.x, targetUnit.y, 4, CONFIG.COLORS.mindControl);
        particle.setDepth(499);
        
        const angle = (i / 8) * Math.PI * 2;
        this.tweens.add({
          targets: particle,
          x: targetUnit.x + Math.cos(angle) * 50,
          y: targetUnit.y + Math.sin(angle) * 50 - 30,
          alpha: 0,
          duration: 800,
          onComplete: () => particle.destroy()
        });
      });
    }
    
    // Move unit to enemy array temporarily
    const unitIndex = this.playerUnits.indexOf(targetUnit);
    if (unitIndex > -1) {
      this.playerUnits.splice(unitIndex, 1);
      this.enemyUnits.push(targetUnit);
    }
    
    // After duration, unit dies
    this.time.delayedCall(config.duration, () => {
      if (!targetUnit.isDead) {
        // Remove mind control visuals
        antenna.destroy();
        antennaBulb.destroy();
        eyeGlow.destroy();
        
        // Unit dies from mind control
        targetUnit.health = 0;
        targetUnit.die();
      }
    });
  }
  
  castPlasmaBomb(x, y) {
    const config = CONFIG.PLASMA_BOMB;
    
    // Mini-UFO flies in from top
    const ufo = this.add.ellipse(x, y - 300, 40, 20, 0x9C27B0);
    ufo.setStrokeStyle(3, CONFIG.COLORS.plasmaBomb);
    ufo.setDepth(600);
    
    // UFO beam underneath
    const beam = this.add.rectangle(x, y - 280, 3, 30, CONFIG.COLORS.plasmaBomb, 0.5);
    beam.setDepth(599);
    
    // Animate UFO hovering down
    this.tweens.add({
      targets: [ufo, beam],
      y: '+=100',
      duration: 800,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        // Drop plasma orb
        const orb = this.add.circle(x, y - 200, 15, CONFIG.COLORS.plasmaBomb);
        orb.setStrokeStyle(3, 0x00FF00);
        orb.setDepth(500);
        
        // Pulsing glow
        this.tweens.add({
          targets: orb,
          scale: 1.2,
          duration: 200,
          yoyo: true,
          repeat: -1,
        });
        
        // Fall to ground
        this.tweens.add({
          targets: orb,
          y: y,
          duration: 600,
          ease: 'Power2',
          onComplete: () => {
            // EXPLOSION!
            orb.destroy();
            
            // Explosion flash
            const flash = this.add.circle(x, y, config.radius, CONFIG.COLORS.plasmaBomb, 0.8);
            flash.setDepth(501);
            
            this.tweens.add({
              targets: flash,
              scale: 1.5,
              alpha: 0,
              duration: 400,
              onComplete: () => flash.destroy()
            });
            
            // Green slime particles
            for (let i = 0; i < 20; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 30 + Math.random() * 60;
              const particle = this.add.circle(x, y, 5 + Math.random() * 5, CONFIG.COLORS.plasmaBomb);
              particle.setDepth(499);
              
              this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 20,
                alpha: 0,
                duration: 600 + Math.random() * 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
              });
            }
            
            // Colorful impact particles (yellow, orange, lime green)
            const colors = [0xFFFF00, 0xFFA500, 0x39FF14, 0x00FF00];
            for (let i = 0; i < 15; i++) {
              const angle = Math.random() * Math.PI * 2;
              const dist = 40 + Math.random() * 50;
              const color = colors[Math.floor(Math.random() * colors.length)];
              const particle = this.add.circle(x, y, 3 + Math.random() * 4, color);
              particle.setDepth(500);
              
              this.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist - 30,
                alpha: 0,
                duration: 400 + Math.random() * 300,
                ease: 'Power1',
                onComplete: () => particle.destroy()
              });
            }
            
            // Damage all player units in radius
            this.playerUnits.forEach(unit => {
              if (unit.isDead) return;
              const dist = Phaser.Math.Distance.Between(x, y, unit.x, unit.y);
              if (dist <= config.radius) {
                unit.takeDamage(config.damage, x, y);
              }
            });
            
            // Screen shake
            this.cameras.main.shake(200, 0.005);
          }
        });
        
        // UFO flies away
        this.tweens.add({
          targets: [ufo, beam],
          y: '-=400',
          alpha: 0,
          duration: 800,
          delay: 600,
          onComplete: () => {
            ufo.destroy();
            beam.destroy();
          }
        });
      }
    });
  }
  
  executeProbeBeam(unit) {
    const manaGain = Math.floor(unit.health);
    
    // Add mana
    if (unit.isEnemy) {
      this.enemyMana = Math.min(CONFIG.MAX_MANA, this.enemyMana + manaGain);
    } else {
      this.mana = Math.min(CONFIG.MAX_MANA, this.mana + manaGain);
    }
    
    // Start cooldown
    this.probeBeamCooldown = CONFIG.PROBE_BEAM_COOLDOWN;
    
    // Visual effect - green tractor beam
    const beam = this.add.rectangle(unit.x, unit.y - 100, 30, 200, CONFIG.COLORS.probeBeam, 0.5);
    beam.setDepth(500);
    
    // Floating mana text (purple color)
    const manaText = this.add.text(unit.x, unit.y - 60, `+${manaGain}`, {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#BB86FC',
      stroke: '#000000',
      strokeThickness: 4,
    });
    manaText.setOrigin(0.5);
    manaText.setDepth(1000);
    
    // Animate unit being pulled up
    this.tweens.add({
      targets: unit,
      y: unit.y - 150,
      alpha: 0,
      scale: unit.scale * 0.5,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        unit.isDead = true;
        unit.destroy();
      }
    });
    
    // Animate beam
    this.tweens.add({
      targets: beam,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        beam.destroy();
      }
    });
    
    // Animate mana text
    this.tweens.add({
      targets: manaText,
      y: manaText.y - 100,
      alpha: 0,
      duration: 1200,
      ease: 'Power2',
      onComplete: () => {
        manaText.destroy();
      }
    });
    
    // "Bloop" sound effect using Tone.js
    if (typeof Tone !== 'undefined') {
      AudioManager.playSFX(() => {
        const synth = new Tone.Synth({
          oscillator: { type: 'sine' },
          envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
        }).toDestination();
        synth.triggerAttackRelease('E5', '0.3');
      });
    }
  }
  
  spawnInitialUnits() {
    let offset = 0;
    
    // Spawn player workers
    for (let i = 0; i < CONFIG.INITIAL_PLAYER_WORKERS; i++) {
      const worker = new Worker(
        this,
        CONFIG.PLAYER_BASE_X + 150 + (offset * 80),
        this.groundY - 40,
        CONFIG.UNITS.worker,
        false
      );
      this.playerUnits.push(worker);
      offset++;
    }
    
    // Spawn player legionaries
    for (let i = 0; i < CONFIG.INITIAL_PLAYER_LEGIONARIES; i++) {
      const unit = new Unit(
        this,
        CONFIG.PLAYER_BASE_X + 150 + (offset * 80),
        this.groundY - 40,
        CONFIG.UNITS.legionary,
        false
      );
      this.playerUnits.push(unit);
      offset++;
    }
    
    // Reset offset for enemy
    offset = 0;
    
    // Spawn enemy workers
    for (let i = 0; i < CONFIG.INITIAL_ENEMY_WORKERS; i++) {
      const worker = new Worker(
        this,
        CONFIG.ENEMY_BASE_X - 150 - (offset * 80),
        this.groundY - 40,
        CONFIG.UNITS.worker,
        true
      );
      this.enemyUnits.push(worker);
      offset++;
    }
    
    // Spawn alien harvesters
    for (let i = 0; i < CONFIG.INITIAL_ALIEN_HARVESTERS; i++) {
      const harvester = new Harvester(
        this,
        CONFIG.ENEMY_BASE_X - 150 - (offset * 80),
        this.groundY - 40,
        CONFIG.ALIEN_UNITS.harvester,
        true
      );
      this.enemyUnits.push(harvester);
      offset++;
    }
    
    // Spawn alien drones
    for (let i = 0; i < CONFIG.INITIAL_ALIEN_DRONES; i++) {
      const unit = new Unit(
        this,
        CONFIG.ENEMY_BASE_X - 150 - (offset * 80),
        this.groundY - 40,
        CONFIG.ALIEN_UNITS.drone,
        true
      );
      this.enemyUnits.push(unit);
      offset++;
    }
  }
  
  applyCampaignSettings() {
    // Clear default units for custom campaign setups
    const clearAllUnits = () => {
      this.playerUnits.forEach(u => u.destroy());
      this.enemyUnits.forEach(u => u.destroy());
      this.playerUnits = [];
      this.enemyUnits = [];
    };
    
    switch(this.campaignLevel) {
      case 1: // Basic Training - Tutorial
        this.campaignObjective = 'tutorial';
        this.tutorialSteps = {
          workers: { needed: 3, current: 0 },
          legionaries: { needed: 5, current: 0 }
        };
        clearAllUnits();
        this.disableAI = true; // No enemy AI in tutorial
        this.gold = 200; // Give extra starting gold for tutorial
        this.createTutorialArrows();
        break;
        
      case 2: // First Contact - Easy AI
        this.campaignObjective = 'destroy_base';
        this.aiDifficulty = 'easy';
        this.aiSpellsEnabled = false;
        break;
        
      case 3: // Hold the Line - Survival
        this.campaignObjective = 'survive';
        this.survivalTimer = 0;
        this.survivalGoal = 180; // 3 minutes
        this.waveSpawnInterval = 3000; // Spawn wave every 3 seconds
        this.lastWaveSpawn = 0;
        break;
        
      case 4: // The Gauntlet - No resources
        this.campaignObjective = 'no_training';
        clearAllUnits();
        // Spawn 10 legionaries for player
        for (let i = 0; i < 10; i++) {
          const unit = new Unit(
            this,
            CONFIG.PLAYER_BASE_X + 150 + (i * 80),
            this.groundY - 40,
            CONFIG.UNITS.legionary,
            false
          );
          this.playerUnits.push(unit);
        }
        // Spawn enemy defenders
        for (let i = 0; i < 8; i++) {
          const unit = new Unit(
            this,
            CONFIG.ENEMY_BASE_X - 150 - (i * 80),
            this.groundY - 40,
            CONFIG.ALIEN_UNITS.drone,
            true
          );
          this.enemyUnits.push(unit);
        }
        this.gold = 0;
        this.disableTraining = true;
        this.aiDifficulty = 'easy';
        this.aiSpellsEnabled = false;
        break;
        
      case 5: // Mana Mastery - Spell tutorial
        this.campaignObjective = 'cast_spells';
        this.gold = 500; // Extra gold for aqueduct
        break;
        
      case 6: // Behind Enemy Lines - No miners
        this.campaignObjective = 'no_miners';
        this.gold = 600;
        clearAllUnits();
        this.disableWorkers = true;
        this.enemyBase.health = 1200; // Fortified base
        this.enemyBase.maxHealth = 1200;
        break;
        
      case 7: // Alien Onslaught - Hard AI
        this.campaignObjective = 'destroy_base';
        this.aiDifficulty = 'hard';
        this.aiSpellsEnabled = true;
        this.enemyBase.health = 1500;
        this.enemyBase.maxHealth = 1500;
        break;
        
      case 8: // The Mothership - Boss fight
        this.campaignObjective = 'boss_fight';
        this.aiDifficulty = 'boss';
        this.aiSpellsEnabled = true;
        this.enemyBase.health = 2500;
        this.enemyBase.maxHealth = 2500;
        this.enemyGold = 300; // AI starts with more
        break;
    }
    
    // Show objective text
    this.showObjectiveText();
  }
  
  applyVikingCampaignSettings() {
    // Clear default units for custom campaign setups
    const clearAllUnits = () => {
      this.playerUnits.forEach(u => u.destroy());
      this.enemyUnits.forEach(u => u.destroy());
      this.playerUnits = [];
      this.enemyUnits = [];
    };
    
    // Import Thrall for Viking campaign
    const { Thrall } = require('./Thrall.js');
    
    switch(this.campaignLevel) {
      case 1: // Raiding Party - Tutorial
        this.campaignObjective = 'viking_tutorial';
        this.tutorialSteps = {
          thralls: { needed: 2, current: 0 },
          berserkers: { needed: 3, current: 0 }
        };
        clearAllUnits();
        this.disableAI = true;
        this.gold = 200;
        this.createVikingTutorialArrows();
        break;
        
      case 2: // Axe to Grind - Destroy Roman fort
        this.campaignObjective = 'destroy_base';
        this.aiDifficulty = 'easy';
        this.aiSpellsEnabled = false;
        // Make enemy Roman
        this.enemyBase.setTexture('player-castle');
        break;
        
      case 3: // Frozen Stand - Survival
        this.campaignObjective = 'survive';
        this.survivalTimer = 0;
        this.survivalGoal = 180; // 3 minutes
        this.waveSpawnInterval = 2500;
        this.lastWaveSpawn = 0;
        break;
        
      case 4: // Thor's Chosen - Limited units, spell focus
        this.campaignObjective = 'viking_spells';
        clearAllUnits();
        // Spawn 8 berserkers
        for (let i = 0; i < 8; i++) {
          const unit = new Unit(
            this,
            CONFIG.PLAYER_BASE_X + 150 + (i * 80),
            this.groundY - 40,
            CONFIG.VIKING_UNITS.berserker,
            false
          );
          this.playerUnits.push(unit);
        }
        this.gold = 100;
        this.mana = 100; // Start with mana
        this.disableTraining = true;
        this.spellsCastRequired = 5; // Must cast 5 spells total
        this.spellsCastCount = 0;
        break;
        
      case 5: // Two Front War - Enemies from both sides
        this.campaignObjective = 'two_front';
        this.gold = 400;
        this.dualFrontMode = true;
        break;
        
      case 6: // Ragnarok - Boss fight
        this.campaignObjective = 'destroy_mothership';
        this.aiDifficulty = 'boss';
        this.aiSpellsEnabled = true;
        this.enemyBase.health = 2000;
        this.enemyBase.maxHealth = 2000;
        this.enemyBase.maxHp = 2000;
        this.enemyGold = 400;
        this.gold = 300;
        break;
    }
    
    this.showObjectiveText();
  }
  
  applyAlienCampaignSettings() {
    // Clear default units for custom campaign setups
    const clearAllUnits = () => {
      this.playerUnits.forEach(u => u.destroy());
      this.enemyUnits.forEach(u => u.destroy());
      this.playerUnits = [];
      this.enemyUnits = [];
    };
    
    // Alien campaign uses Harvester class instead of Worker
    const alienLevel = this.alienLevel || 1;
    
    switch(alienLevel) {
      case 1: // Abduction 101 - Tutorial
        this.campaignObjective = 'alien_tutorial';
        this.tutorialSteps = {
          harvesters: { needed: 2, current: 0 },
          drones: { needed: 3, current: 0 }
        };
        clearAllUnits();
        this.disableAI = true; // No enemy AI in tutorial
        this.gold = 200; // Give extra starting gold for tutorial
        this.createAlienTutorialArrows();
        break;
        
      case 2: // Colony Strike - Destroy Roman fort (easy AI)
        this.campaignObjective = 'destroy_base';
        this.aiDifficulty = 'easy';
        this.aiSpellsEnabled = false;
        // Enemy is Roman
        this.enemyFaction = 'roman';
        break;
        
      case 3: // Harvest Season - Collect 1500 gold while defending
        this.campaignObjective = 'alien_gold_rush';
        this.goldGoal = 1500;
        this.waveSpawnInterval = 4000; // Waves every 4 seconds
        this.lastWaveSpawn = 0;
        this.aiDifficulty = 'medium';
        break;
        
      case 4: // Mind Games - Use Mind Control 5 times, limited units
        this.campaignObjective = 'alien_mind_control';
        this.mindControlCount = 0;
        this.mindControlGoal = 5;
        clearAllUnits();
        // Spawn 5 drones for player
        for (let i = 0; i < 5; i++) {
          const unit = new Unit(
            this,
            CONFIG.PLAYER_BASE_X + 150 + (i * 80),
            this.groundY - 40,
            CONFIG.ALIEN_UNITS.drone,
            false,
            'alien'
          );
          this.playerUnits.push(unit);
        }
        this.gold = 300; // Limited gold, focus on spells
        this.mana = 100; // Start with mana
        this.disableTraining = false; // Can train but gold is limited
        this.aiDifficulty = 'medium';
        break;
        
      case 5: // Invasion Force - Destroy Viking longhouse (medium AI)
        this.campaignObjective = 'destroy_base';
        this.aiDifficulty = 'medium';
        this.aiSpellsEnabled = true;
        // Enemy is Viking
        this.enemyFaction = 'viking';
        this.enemyBase.maxHealth = 1200;
        this.enemyBase.health = 1200;
        break;
        
      case 6: // World Domination - Destroy 2000 HP Roman fortress (hard AI)
        this.campaignObjective = 'alien_boss_fight';
        this.aiDifficulty = 'hard';
        this.aiSpellsEnabled = true;
        this.aiUpgradesEnabled = true;
        // Enemy is Roman with all upgrades
        this.enemyFaction = 'roman';
        this.enemyBase.maxHealth = 2000;
        this.enemyBase.health = 2000;
        this.enemyGold = 400; // AI starts with bonus gold
        this.gold = 300; // Player starts with bonus gold too
        break;
    }
    
    this.showObjectiveText();
  }
  
  applySkirmishDifficulty() {
    // Clear default units for skirmish - both sides start fresh
    this.playerUnits.forEach(u => u.destroy());
    this.enemyUnits.forEach(u => u.destroy());
    this.playerUnits = [];
    this.enemyUnits = [];
    
    // Apply difficulty modifiers
    switch(this.skirmishDifficulty) {
      case 'easy':
        this.aiSpawnMultiplier = 1.8; // Slower spawning
        this.aiSpellsEnabled = false;
        this.aiUpgradesEnabled = false;
        this.aiResourceMultiplier = 0.8; // -20% resource income
        break;
        
      case 'medium':
        this.aiSpawnMultiplier = 1.2; // Moderate spawning
        this.aiSpellsEnabled = true;
        this.aiUpgradesEnabled = true;
        this.aiMaxUpgrades = 2; // Buy only 1-2 upgrades
        this.aiResourceMultiplier = 1.0; // Normal resources
        break;
        
      case 'hard':
        this.aiSpawnMultiplier = 0.75; // Fast spawning
        this.aiSpellsEnabled = true;
        this.aiUpgradesEnabled = true;
        this.aiMaxUpgrades = 10; // Buy all upgrades
        this.aiResourceMultiplier = 1.15; // +15% resource bonus
        break;
    }
  }
  
  applyChallengeModeSettings() {
    // Clear default units for challenges
    this.playerUnits.forEach(u => u.destroy());
    this.enemyUnits.forEach(u => u.destroy());
    this.playerUnits = [];
    this.enemyUnits = [];
    
    switch(this.challengeMode) {
      case 'endless':
        // Endless Waves - survive as long as possible
        this.campaignObjective = 'challenge_endless';
        this.endlessWaveNumber = 1;
        this.endlessSpawnInterval = 5000; // Start at 5 seconds between waves
        this.lastEndlessWave = 0;
        this.endlessUnitsPerWave = 2; // Start with 2 units per wave
        this.gold = 300; // Extra starting gold
        this.mana = 50;
        this.disableAI = true; // Manual wave spawning
        
        // Create wave counter display
        this.createEndlessWaveDisplay();
        break;
        
      case 'goldrush':
        // Gold Rush - collect 2000 gold as fast as possible
        this.campaignObjective = 'challenge_goldrush';
        this.goldGoal = 2000;
        this.challengeStartTime = this.time.now;
        this.disableAI = true; // No enemies
        this.gold = 100; // Start with minimal gold
        
        // Create gold counter display
        this.createGoldRushDisplay();
        break;
        
      case 'spellmaster':
        // Spell Master - win using only spells, no combat units
        this.campaignObjective = 'challenge_spellmaster';
        this.disableTraining = false;
        this.spellMasterViolation = false;
        this.gold = 400;
        this.mana = 100;
        this.aiDifficulty = 'medium';
        this.aiSpellsEnabled = true;
        
        // Create warning display
        this.createSpellMasterDisplay();
        break;
        
      case 'speedblitz':
        // Speed Blitz - destroy enemy base under 3 minutes
        this.campaignObjective = 'challenge_speedblitz';
        this.speedBlitzTimeLimit = 180; // 3 minutes in seconds
        this.challengeStartTime = this.time.now;
        this.gold = 250;
        this.aiDifficulty = 'easy';
        this.aiSpellsEnabled = false;
        this.speedBlitzMilestones = { 120: false, 60: false, 30: false }; // Track milestone notifications
        
        // Create timer display
        this.createSpeedBlitzDisplay();
        break;
    }
    
    this.showObjectiveText();
  }
  
  createEndlessWaveDisplay() {
    const { width } = this.scale;
    
    // Wave counter
    this.endlessWaveText = this.add.text(width / 2, 80, 'WAVE 1', {
      fontSize: '32px',
      fontFamily: 'Press Start 2P',
      color: '#FF4444',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.endlessWaveText.setOrigin(0.5);
    this.endlessWaveText.setScrollFactor(0);
    this.endlessWaveText.setDepth(1000);
    
    // Survival time
    this.endlessSurvivalText = this.add.text(width / 2, 130, 'Time: 0s', {
      fontSize: '18px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.endlessSurvivalText.setOrigin(0.5);
    this.endlessSurvivalText.setScrollFactor(0);
    this.endlessSurvivalText.setDepth(1000);
  }
  
  createGoldRushDisplay() {
    const { width } = this.scale;
    
    this.goldRushText = this.add.text(width / 2, 100, 'GOLD RUSH', {
      fontSize: '28px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.goldRushText.setOrigin(0.5);
    this.goldRushText.setScrollFactor(0);
    this.goldRushText.setDepth(1000);
    
    this.goldRushProgress = this.add.text(width / 2, 150, '100 / 2000', {
      fontSize: '22px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.goldRushProgress.setOrigin(0.5);
    this.goldRushProgress.setScrollFactor(0);
    this.goldRushProgress.setDepth(1000);
  }
  
  createSpellMasterDisplay() {
    const { width } = this.scale;
    
    this.spellMasterText = this.add.text(width / 2, 100, 'SPELL MASTER\nNo Combat Units Allowed!', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#00CED1',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    });
    this.spellMasterText.setOrigin(0.5);
    this.spellMasterText.setScrollFactor(0);
    this.spellMasterText.setDepth(1000);
  }
  
  createSpeedBlitzDisplay() {
    const { width } = this.scale;
    
    this.speedBlitzText = this.add.text(width / 2, 60, 'SPEED BLITZ', {
      fontSize: '28px',
      fontFamily: 'Press Start 2P',
      color: '#FF00FF',
      stroke: '#000000',
      strokeThickness: 6,
    });
    this.speedBlitzText.setOrigin(0.5);
    this.speedBlitzText.setScrollFactor(0);
    this.speedBlitzText.setDepth(1000);
    
    // Create circular timer background
    this.speedBlitzCircleBg = this.add.circle(width / 2, 140, 50, 0x000000, 0.6);
    this.speedBlitzCircleBg.setStrokeStyle(4, 0x444444);
    this.speedBlitzCircleBg.setScrollFactor(0);
    this.speedBlitzCircleBg.setDepth(999);
    
    // Create circular progress graphics
    this.speedBlitzCircle = this.add.graphics();
    this.speedBlitzCircle.setScrollFactor(0);
    this.speedBlitzCircle.setDepth(1000);
    
    // Timer text in center of circle
    this.speedBlitzTimer = this.add.text(width / 2, 140, '3:00', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4,
    });
    this.speedBlitzTimer.setOrigin(0.5);
    this.speedBlitzTimer.setScrollFactor(0);
    this.speedBlitzTimer.setDepth(1001);
    
    // Warning icon (exclamation mark) - hidden by default
    this.speedBlitzWarning = this.add.text(width / 2, 200, '⚠️', {
      fontSize: '32px',
    });
    this.speedBlitzWarning.setOrigin(0.5);
    this.speedBlitzWarning.setScrollFactor(0);
    this.speedBlitzWarning.setDepth(1001);
    this.speedBlitzWarning.setVisible(false);
  }
  
  createTutorialArrows() {
    const { width, height } = this.scale;
    this.tutorialArrows = [];
    this.tutorialPhase = 'workers'; // Track current tutorial phase
    
    // Worker button position (first button in top bar)
    // Gold (100px) + Mana (100px) + Divider (15px) + half button (25px) = ~240px
    const workerButtonX = 245;
    const workerButtonY = 35; // Top bar center Y
    
    // Create semi-transparent overlay to darken everything except tutorial area
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.4); // Lighter overlay - was 0.6
    overlay.fillRect(0, 0, width, height);
    overlay.setScrollFactor(0);
    overlay.setDepth(997);
    
    // Cut out spotlight circle around the worker button
    overlay.fillStyle(0x000000, 0);
    overlay.fillCircle(workerButtonX, workerButtonY, 100); // Larger - was 60
    
    // Cut out a strip at the bottom for control buttons (speed, pause, menu, etc.)
    // Control buttons are at bottom-right, roughly y=height-35
    overlay.fillRect(width - 300, height - 70, 300, 70);
    
    this.tutorialArrows.push(overlay);
    this.tutorialOverlay = overlay; // Store reference for updates
    
    // Add SKIP button in bottom-right corner (above control buttons)
    const skipButton = this.add.rectangle(width - 80, height - 90, 140, 45, 0xFF5722, 0.95);
    skipButton.setInteractive({ useHandCursor: true });
    skipButton.setStrokeStyle(3, 0xFFFFFF);
    skipButton.setScrollFactor(0);
    skipButton.setDepth(1001);
    this.tutorialArrows.push(skipButton);
    
    const skipText = this.add.text(width - 80, height - 90, 'SKIP TUTORIAL', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    skipText.setOrigin(0.5);
    skipText.setScrollFactor(0);
    skipText.setDepth(1002);
    this.tutorialArrows.push(skipText);
    
    skipButton.on('pointerdown', () => this.skipTutorial());
    skipButton.on('pointerover', () => skipButton.setFillStyle(0xFF7043));
    skipButton.on('pointerout', () => skipButton.setFillStyle(0xFF5722))
    
    // Add bright glow rectangle directly on the button
    const buttonGlow = this.add.rectangle(workerButtonX, workerButtonY, 55, 55, 0xFFD700, 0);
    buttonGlow.setStrokeStyle(5, 0xFFD700, 1);
    buttonGlow.setScrollFactor(0);
    buttonGlow.setDepth(999);
    this.tutorialArrows.push(buttonGlow);
    this.tutorialButtonGlow = buttonGlow; // Store reference
    
    // Pulse the button glow
    this.tweens.add({
      targets: buttonGlow,
      alpha: 0.8,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Create drop shadow for message box
    const messageShadow = this.add.rectangle(width / 2 + 4, 194, 650, 100, 0x000000, 0.5);
    messageShadow.setScrollFactor(0);
    messageShadow.setDepth(998);
    this.tutorialArrows.push(messageShadow);
    
    // Create tutorial message box (larger, more visible)
    const messageBox = this.add.rectangle(width / 2, 190, 650, 100, 0x1a1a2e, 0.98);
    messageBox.setStrokeStyle(6, 0xFFD700);
    messageBox.setScrollFactor(0);
    messageBox.setDepth(999);
    this.tutorialArrows.push(messageBox);
    
    // Add subtle glow to message box
    this.tweens.add({
      targets: messageBox,
      alpha: 0.95,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Tutorial message text (larger, bolder)
    const messageText = this.add.text(width / 2, 190, 
      'Welcome to training!\nClick the WORKER button to train miners.', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 5,
      align: 'center',
      lineSpacing: 8
    });
    messageText.setOrigin(0.5);
    messageText.setScrollFactor(0);
    messageText.setDepth(1000);
    this.tutorialArrows.push(messageText);
    this.tutorialMessageText = messageText;
    
    // Create animated pointer hand (pointing UP since button is at top)
    const pointerHand = this.add.text(workerButtonX - 30, workerButtonY + 50, '👆', {
      fontSize: '48px',
    });
    pointerHand.setScrollFactor(0);
    pointerHand.setDepth(1000);
    pointerHand.setOrigin(0.5);
    this.tutorialArrows.push(pointerHand);
    this.tutorialPointerHand = pointerHand; // Store reference
    
    // Animate hand pointing up
    this.tweens.add({
      targets: pointerHand,
      y: workerButtonY + 40,
      scale: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Create pulsing highlight circle around WORKER button
    const highlightCircle = this.add.circle(workerButtonX, workerButtonY, 35, 0xFFD700, 0);
    highlightCircle.setStrokeStyle(4, 0xFFD700, 1);
    highlightCircle.setScrollFactor(0);
    highlightCircle.setDepth(998); // Behind button but visible
    this.tutorialArrows.push(highlightCircle);
    this.tutorialHighlight1 = highlightCircle; // Store reference
    
    // Animate highlight pulsing
    this.tweens.add({
      targets: highlightCircle,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1000,
      repeat: -1,
      ease: 'Power2'
    });
    
    // Add a second delayed pulse for ripple effect
    const highlightCircle2 = this.add.circle(workerButtonX, workerButtonY, 35, 0xFFD700, 0);
    highlightCircle2.setStrokeStyle(4, 0xFFD700, 1);
    highlightCircle2.setScrollFactor(0);
    highlightCircle2.setDepth(998);
    this.tutorialArrows.push(highlightCircle2);
    this.tutorialHighlight2 = highlightCircle2; // Store reference
    
    this.tweens.add({
      targets: highlightCircle2,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0,
      duration: 1000,
      delay: 500,
      repeat: -1,
      ease: 'Power2'
    });
    
    // Classic arrow pointing up (since buttons are at top)
    const workerArrow = this.add.text(workerButtonX, workerButtonY + 80, '⬆', {
      fontSize: '48px',
      color: '#FFD700'
    });
    workerArrow.setScrollFactor(0);
    workerArrow.setDepth(1000);
    workerArrow.setOrigin(0.5);
    this.tutorialArrows.push(workerArrow);
    this.tutorialArrow = workerArrow;
    
    // Animate arrow bouncing up
    this.tweens.add({
      targets: workerArrow,
      y: workerButtonY + 70,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Progress counter (below arrow)
    const progressText = this.add.text(workerButtonX, workerButtonY + 110, '0/3', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    });
    progressText.setOrigin(0.5);
    progressText.setScrollFactor(0);
    progressText.setDepth(1000);
    this.tutorialArrows.push(progressText);
    this.tutorialProgressText = progressText;
    
    // Add "CLICK HERE" text label (to the right of button)
    const clickHereText = this.add.text(workerButtonX + 65, workerButtonY + 5, 'CLICK\nHERE!', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
      lineSpacing: 2
    });
    clickHereText.setOrigin(0, 0.5);
    clickHereText.setScrollFactor(0);
    clickHereText.setDepth(1000);
    this.tutorialArrows.push(clickHereText);
    this.tutorialClickText = clickHereText; // Store reference
    
    // Add background box for click text for better visibility
    const clickTextBg = this.add.rectangle(clickHereText.x + 30, clickHereText.y, 85, 45, 0x000000, 0.7);
    clickTextBg.setScrollFactor(0);
    clickTextBg.setDepth(999);
    clickTextBg.setStrokeStyle(2, 0xFFD700);
    this.tutorialArrows.push(clickTextBg);
    this.tutorialClickTextBg = clickTextBg;
    
    // Pulse the click here text
    this.tweens.add({
      targets: [clickHereText, clickTextBg],
      scale: 1.15,
      duration: 400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  createAlienTutorialArrows() {
    const { width, height } = this.scale;
    this.tutorialArrows = [];
    this.tutorialPhase = 'harvesters'; // Track current tutorial phase
    
    // Create tutorial message box with alien theme
    const messageBox = this.add.rectangle(width / 2, 120, 700, 80, 0x1a0033, 0.95);
    messageBox.setStrokeStyle(4, 0x9C27B0);
    messageBox.setScrollFactor(0);
    messageBox.setDepth(999);
    this.tutorialArrows.push(messageBox);
    
    // Tutorial message text
    const messageText = this.add.text(width / 2, 120, 
      'Greetings, inferior being.\nClick the HARVESTER button to gather resources.', {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#E1BEE7',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
      lineSpacing: 5
    });
    messageText.setOrigin(0.5);
    messageText.setScrollFactor(0);
    messageText.setDepth(1000);
    this.tutorialArrows.push(messageText);
    this.tutorialMessageText = messageText;
    
    // Arrow pointing to harvester button (first button)
    const harvesterArrow = this.add.text(95, 80, '⬇', {
      fontSize: '48px',
      color: '#00FF00'
    });
    harvesterArrow.setScrollFactor(0);
    harvesterArrow.setDepth(1000);
    harvesterArrow.setOrigin(0.5);
    this.tutorialArrows.push(harvesterArrow);
    this.tutorialArrow = harvesterArrow;
    
    // Progress counter
    const progressText = this.add.text(95, 140, '0/2', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#00FF00',
      stroke: '#000000',
      strokeThickness: 3
    });
    progressText.setOrigin(0.5);
    progressText.setScrollFactor(0);
    progressText.setDepth(1000);
    this.tutorialArrows.push(progressText);
    this.tutorialProgressText = progressText;
    
    // Animate arrow bouncing
    this.tweens.add({
      targets: harvesterArrow,
      y: '+=10',
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
  
  updateTutorialArrows() {
    if (!this.tutorialArrows || !this.tutorialSteps) return;
    
    // Update progress counter for current phase
    if (this.tutorialPhase === 'workers') {
      const current = this.tutorialSteps.workers.current;
      const needed = this.tutorialSteps.workers.needed;
      
      if (this.tutorialProgressText) {
        this.tutorialProgressText.setText(`${current}/${needed}`);
      }
      
      // Check if workers training complete
      if (current >= needed && this.tutorialPhase === 'workers') {
        this.tutorialPhase = 'wait_for_gold';
        
        // Show message about workers gathering gold
        if (this.tutorialMessageText) {
          this.tutorialMessageText.setText('Perfect! Workers will gather gold from mines.\nWatch your gold increase, then train soldiers!');
        }
        
        // Hide arrow temporarily
        if (this.tutorialArrow) {
          this.tutorialArrow.setVisible(false);
        }
        if (this.tutorialProgressText) {
          this.tutorialProgressText.setVisible(false);
        }
        
        // Wait 3 seconds, then show legionary prompt
        this.time.delayedCall(3000, () => {
          this.tutorialPhase = 'legionaries';
          // Legionary is second button (worker + spacing)
          const legionaryButtonX = 245 + 50 + 8; // 303px
          const legionaryButtonY = 35; // Top bar center Y
          
          if (this.tutorialMessageText) {
            this.tutorialMessageText.setText('Great! Now train combat units.\nClick the LEGIONARY button 5 times.');
          }
          
          // Update spotlight overlay to highlight legionary button
          if (this.tutorialOverlay) {
            this.tutorialOverlay.clear();
            this.tutorialOverlay.fillStyle(0x000000, 0.4); // Lighter overlay
            this.tutorialOverlay.fillRect(0, 0, this.scale.width, this.scale.height);
            this.tutorialOverlay.fillStyle(0x000000, 0);
            this.tutorialOverlay.fillCircle(legionaryButtonX, legionaryButtonY, 100); // Larger spotlight
            // Keep control buttons accessible
            this.tutorialOverlay.fillRect(this.scale.width - 300, this.scale.height - 70, 300, 70);
          }
          
          // Move button glow
          if (this.tutorialButtonGlow) {
            this.tutorialButtonGlow.x = legionaryButtonX;
            this.tutorialButtonGlow.y = legionaryButtonY;
          }
          
          // Move pointer hand
          if (this.tutorialPointerHand) {
            this.tweens.killTweensOf(this.tutorialPointerHand);
            this.tutorialPointerHand.x = legionaryButtonX - 30;
            this.tutorialPointerHand.y = legionaryButtonY + 50;
            this.tutorialPointerHand.setVisible(true);
            
            this.tweens.add({
              targets: this.tutorialPointerHand,
              y: legionaryButtonY + 40,
              scale: 1.1,
              duration: 600,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
          
          // Move highlight circles
          if (this.tutorialHighlight1) {
            this.tutorialHighlight1.x = legionaryButtonX;
            this.tutorialHighlight1.y = legionaryButtonY;
          }
          if (this.tutorialHighlight2) {
            this.tutorialHighlight2.x = legionaryButtonX;
            this.tutorialHighlight2.y = legionaryButtonY;
          }
          
          // Move click here text
          if (this.tutorialClickText) {
            this.tutorialClickText.x = legionaryButtonX + 65;
            this.tutorialClickText.y = legionaryButtonY + 5;
            this.tutorialClickText.setVisible(true);
          }
          
          // Move click text background
          if (this.tutorialClickTextBg) {
            this.tutorialClickTextBg.x = legionaryButtonX + 95;
            this.tutorialClickTextBg.y = legionaryButtonY + 5;
            this.tutorialClickTextBg.setVisible(true);
          }
          
          // Show and move arrow to legionary button (pointing UP)
          if (this.tutorialArrow) {
            this.tutorialArrow.setVisible(true);
            this.tweens.killTweensOf(this.tutorialArrow);
            this.tutorialArrow.x = legionaryButtonX;
            this.tutorialArrow.y = legionaryButtonY + 80;
            
            // Re-add bounce animation (upward)
            this.tweens.add({
              targets: this.tutorialArrow,
              y: legionaryButtonY + 70,
              duration: 500,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
          
          // Move and show progress counter
          if (this.tutorialProgressText) {
            this.tutorialProgressText.setVisible(true);
            this.tutorialProgressText.x = legionaryButtonX;
            this.tutorialProgressText.y = legionaryButtonY + 110;
            this.tutorialProgressText.setText('0/5');
          }
        });
      }
    } else if (this.tutorialPhase === 'wait_for_gold') {
      // Just waiting, do nothing
    } else if (this.tutorialPhase === 'legionaries') {
      const current = this.tutorialSteps.legionaries.current;
      const needed = this.tutorialSteps.legionaries.needed;
      
      if (this.tutorialProgressText) {
        this.tutorialProgressText.setText(`${current}/${needed}`);
      }
      
      // Check if legionaries training complete
      if (current >= needed) {
        // Tutorial complete!
        if (this.tutorialMessageText) {
          this.tutorialMessageText.setText('Excellent! Training complete!');
        }
        
        // Hide arrow and progress
        if (this.tutorialArrow) {
          this.tweens.add({
            targets: this.tutorialArrow,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (this.tutorialArrow) this.tutorialArrow.destroy();
            }
          });
        }
        
        if (this.tutorialProgressText) {
          this.tweens.add({
            targets: this.tutorialProgressText,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              if (this.tutorialProgressText) this.tutorialProgressText.destroy();
            }
          });
        }
        
        // Fade out message after delay
        this.time.delayedCall(2000, () => {
          this.tutorialArrows.forEach(a => {
            this.tweens.add({
              targets: a,
              alpha: 0,
              duration: 1000,
              onComplete: () => a.destroy()
            });
          });
          this.tutorialArrows = [];
        });
        
        this.campaignComplete = true;
      }
    }
  }
  
  showObjectiveText() {
    const { width, height } = this.scale;
    const objectives = {
      tutorial: 'Train 3 Workers and 5 Legionaries',
      destroy_base: 'Destroy the Alien Base!',
      survive: 'Survive for 3 Minutes!',
      no_training: 'Destroy the base with your 10 Legionaries!',
      cast_spells: 'Build Aqueduct & Cast All 3 Spells!',
      no_miners: 'Destroy the Fortified Base (No Miners!)',
      boss_fight: 'Destroy the Mothership!'
    };
    
    const objectiveText = this.add.text(width / 2, height - 60, 
      'OBJECTIVE: ' + objectives[this.campaignObjective], {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center'
    });
    objectiveText.setOrigin(0.5);
    objectiveText.setScrollFactor(0);
    objectiveText.setDepth(1000);
    
    // Fade out after 5 seconds
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: objectiveText,
        alpha: 0,
        duration: 1000,
        onComplete: () => objectiveText.destroy()
      });
    });
  }
  
  showTutorialHint(message) {
    // Prevent spam by checking if hint already showing
    if (this.tutorialHintActive) return;
    this.tutorialHintActive = true;
    
    const { width } = this.scale;
    const hint = this.add.text(width / 2, 200, message, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#FF6B6B',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    });
    hint.setOrigin(0.5);
    hint.setScrollFactor(0);
    hint.setDepth(1001);
    hint.setAlpha(0);
    
    // Fade in
    this.tweens.add({
      targets: hint,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        // Fade out after 2 seconds
        this.time.delayedCall(2000, () => {
          this.tweens.add({
            targets: hint,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              hint.destroy();
              this.tutorialHintActive = false;
            }
          });
        });
      }
    });
  }
  
  spawnPlayerUnit(unitKey, config) {
    // Campaign restrictions
    if (this.disableTraining) return; // Level 4 - no training
    if (this.disableWorkers && unitKey === 'worker') return; // Level 6 - no workers
    
    // Check if can afford
    if (!this.canAfford(config.cost)) {
      // Tutorial hint when player can't afford
      if (this.campaignObjective === 'tutorial' && this.tutorialPhase === 'legionaries') {
        this.showTutorialHint('Not enough gold! Wait for workers to gather more.');
      }
      return;
    }
    
    // Check cooldown
    if (this.unitCooldowns[unitKey] > 0) return;
    
    // Deduct gold
    this.gold -= config.cost;
    
    // Start cooldown (no cooldown reduction for player Roman units)
    this.unitCooldowns[unitKey] = config.cooldown;
    
    // Spawn unit near player base
    let unit;
    if (unitKey === 'worker') {
      unit = new Worker(
        this,
        CONFIG.PLAYER_BASE_X + 150,
        this.groundY - 40,
        config,
        false
      );
    } else {
      unit = new Unit(
        this,
        CONFIG.PLAYER_BASE_X + 150,
        this.groundY - 40,
        config,
        false
      );
    }
    
    this.playerUnits.push(unit);
    
    // Play unit trained sound
    soundEffects.playUnitTrained();
    
    // Track stat
    this.stats.unitsTrained++;
    
    // Track tutorial progress
    if (this.campaignObjective === 'tutorial' && this.tutorialSteps) {
      if (unitKey === 'worker') {
        this.tutorialSteps.workers.current++;
      } else if (unitKey === 'legionary') {
        this.tutorialSteps.legionaries.current++;
      }
    }
    
    // Track alien tutorial progress
    if (this.campaignObjective === 'alien_tutorial' && this.tutorialSteps) {
      if (unitKey === 'harvester') {
        this.tutorialSteps.harvesters.current++;
      } else if (unitKey === 'drone') {
        this.tutorialSteps.drones.current++;
      }
    }
    
    // Apply upgrades to new unit
    this.applyUpgradeBonuses(unit, 'roman');
    
    // Spawn animation
    unit.setScale(0);
    this.tweens.add({
      targets: unit,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }
  
  skirmishAISpawn() {
    // Phase 1: Train 2-3 miners first
    if (this.aiPhase === 'initial_miners') {
      const minerCount = this.enemyUnits.filter(u => !u.isDead && u.isWorker).length;
      const targetMiners = 2 + Math.floor(Math.random() * 2); // 2-3 miners
      
      if (minerCount < targetMiners) {
        const harvesterConfig = CONFIG.ALIEN_UNITS.harvester;
        if (this.enemyGold >= harvesterConfig.cost) {
          this.enemyGold -= harvesterConfig.cost;
          this.aiMinerCount++;
          
          const harvester = new Harvester(
            this,
            CONFIG.ENEMY_BASE_X - 150,
            this.groundY - 40,
            harvesterConfig,
            true
          );
          this.enemyUnits.push(harvester);
          this.applyUpgradeBonuses(harvester, 'alien');
          
          harvester.setScale(0);
          this.tweens.add({
            targets: harvester,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut',
          });
          
          return;
        }
      } else {
        // Move to next phase
        this.aiPhase = 'build_mana';
      }
    }
    
    // Phase 2: Build mana source (aqueduct equivalent for aliens - handled in upgrade check)
    if (this.aiPhase === 'build_mana') {
      // Check if we have some gold to build mana source
      if (this.enemyGold >= 200 && !this.aiManaSourceBuilt) {
        // This will be handled by the upgrade purchasing logic
        this.aiPhase = 'mixed_combat';
      } else if (this.aiManaSourceBuilt || this.enemyGold >= 300) {
        // Skip to combat if we have gold but can't build yet
        this.aiPhase = 'mixed_combat';
      }
    }
    
    // Phase 3: Train mixed combat units
    if (this.aiPhase === 'mixed_combat') {
      // Maintain minimum miners
      const minerCount = this.enemyUnits.filter(u => !u.isDead && u.isWorker).length;
      if (minerCount < 2) {
        const harvesterConfig = CONFIG.ALIEN_UNITS.harvester;
        if (this.enemyGold >= harvesterConfig.cost) {
          this.enemyGold -= harvesterConfig.cost;
          
          const harvester = new Harvester(
            this,
            CONFIG.ENEMY_BASE_X - 150,
            this.groundY - 40,
            harvesterConfig,
            true
          );
          this.enemyUnits.push(harvester);
          this.applyUpgradeBonuses(harvester, 'alien');
          
          harvester.setScale(0);
          this.tweens.add({
            targets: harvester,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut',
          });
          return;
        }
      }
      
      // Train combat units with variety (slight randomness)
      const combatUnits = Object.entries(CONFIG.ALIEN_UNITS).filter(([key, cfg]) => {
        return key !== 'harvester' && this.enemyGold >= cfg.cost;
      });
      
      if (combatUnits.length === 0) return;
      
      // Weighted selection for unit variety
      let unitKey, unitConfig;
      const rand = Math.random();
      
      if (rand < 0.4 && this.enemyGold >= CONFIG.ALIEN_UNITS.drone.cost) {
        // 40% chance for basic drone
        unitKey = 'drone';
        unitConfig = CONFIG.ALIEN_UNITS.drone;
      } else if (rand < 0.75 && this.enemyGold >= CONFIG.ALIEN_UNITS.blaster.cost) {
        // 35% chance for blaster (ranged)
        unitKey = 'blaster';
        unitConfig = CONFIG.ALIEN_UNITS.blaster;
      } else if (this.enemyGold >= CONFIG.ALIEN_UNITS.overlord.cost) {
        // 25% chance for overlord (elite)
        unitKey = 'overlord';
        unitConfig = CONFIG.ALIEN_UNITS.overlord;
      } else {
        // Fallback to affordable unit
        [unitKey, unitConfig] = combatUnits[Math.floor(Math.random() * combatUnits.length)];
      }
      
      this.enemyGold -= unitConfig.cost;
      
      const unit = new Unit(
        this,
        CONFIG.ENEMY_BASE_X - 150,
        this.groundY - 40,
        unitConfig,
        true
      );
      
      this.enemyUnits.push(unit);
      this.applyUpgradeBonuses(unit, 'alien');
      
      unit.setScale(0);
      this.tweens.add({
        targets: unit,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    }
  }
  
  spawnEnemyUnit() {
    // Skirmish AI strategy phases
    if (this.skirmishDifficulty) {
      return this.skirmishAISpawn();
    }
    
    // Count current workers
    const workerCount = this.enemyUnits.filter(u => !u.isDead && u.isWorker).length;
    
    // Apply cloning vats cooldown reduction to alien spawns
    const cooldownMultiplier = this.alienUpgrades.cloningVats ? 
      (1 - CONFIG.ALIEN_UPGRADES.cloningVats.cooldownReduction) : 1;
    
    // AI prioritizes maintaining worker count
    if (workerCount < CONFIG.AI_MIN_WORKERS || Math.random() < CONFIG.AI_WORKER_PRIORITY) {
      const harvesterConfig = CONFIG.ALIEN_UNITS.harvester;
      if (this.enemyGold >= harvesterConfig.cost) {
        this.enemyGold -= harvesterConfig.cost;
        
        const harvester = new Harvester(
          this,
          CONFIG.ENEMY_BASE_X - 150,
          this.groundY - 40,
          harvesterConfig,
          true
        );
        this.enemyUnits.push(harvester);
        
        // Apply upgrades to new unit
        this.applyUpgradeBonuses(harvester, 'alien');
        
        // Spawn animation
        harvester.setScale(0);
        this.tweens.add({
          targets: harvester,
          scale: 1,
          duration: 200,
          ease: 'Back.easeOut',
        });
        return;
      }
    }
    
    // Spawn combat units - filter by affordability
    const combatUnits = Object.entries(CONFIG.ALIEN_UNITS).filter(([key, cfg]) => {
      return key !== 'harvester' && this.enemyGold >= cfg.cost;
    });
    
    if (combatUnits.length === 0) return;
    
    // Randomly choose affordable combat unit
    const [key, config] = combatUnits[Math.floor(Math.random() * combatUnits.length)];
    
    // Deduct cost
    this.enemyGold -= config.cost;
    
    const unit = new Unit(
      this,
      CONFIG.ENEMY_BASE_X - 150,
      this.groundY - 40,
      config,
      true
    );
    
    this.enemyUnits.push(unit);
    
    // Apply upgrades to new unit
    this.applyUpgradeBonuses(unit, 'alien');
    
    // Spawn animation
    unit.setScale(0);
    this.tweens.add({
      targets: unit,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }
  
  canAfford(cost) {
    return this.gold >= cost;
  }
  
  updateCamera(delta) {
    if (this.isGameOver) return;
    
    const speed = CONFIG.CAMERA_SCROLL_SPEED * (delta / 1000);
    
    // Keyboard scrolling
    if (this.cursors.left.isDown || this.keyA.isDown) {
      this.cameras.main.scrollX -= speed;
    }
    if (this.cursors.right.isDown || this.keyD.isDown) {
      this.cameras.main.scrollX += speed;
    }
    
    // Mouse edge scrolling
    if (this.cameraScrolling.left) {
      this.cameras.main.scrollX -= speed;
    }
    if (this.cameraScrolling.right) {
      this.cameras.main.scrollX += speed;
    }
    
    // Clamp camera to world bounds
    this.cameras.main.scrollX = Phaser.Math.Clamp(
      this.cameras.main.scrollX,
      0,
      CONFIG.WORLD_WIDTH - this.scale.width
    );
  }
  
  updateCampaignObjectives(time, delta) {
    switch(this.campaignObjective) {
      case 'tutorial':
        this.updateTutorialArrows();
        if (this.campaignComplete && !this.levelCompleted) {
          this.levelCompleted = true;
          const newProgress = this.campaignLevel + 1;
          localStorage.setItem('campaignProgress', newProgress.toString());
          this.registry.set('campaignProgress', newProgress);
          console.log('ROMAN tutorial complete, saved:', newProgress);
          this.time.delayedCall(1000, () => {
            this.gameOver(true);
          });
        }
        break;
        
      case 'alien_tutorial':
        this.updateAlienTutorialArrows();
        if (this.campaignComplete && !this.levelCompleted) {
          this.levelCompleted = true;
          const newProgress = this.alienLevel + 1;
          localStorage.setItem('alienCampaignProgress', newProgress.toString());
          this.registry.set('alienCampaignProgress', newProgress);
          console.log('ALIEN tutorial complete, saved:', newProgress);
          this.time.delayedCall(1000, () => {
            this.gameOver(true);
          });
        }
        break;
        
      case 'alien_gold_rush':
        // Show gold counter
        if (!this.goldRushText) {
          const { width } = this.scale;
          this.goldRushText = this.add.text(width / 2, 100, '', {
            fontSize: '24px',
            fontFamily: 'Press Start 2P',
            color: '#00FF00',
            stroke: '#000000',
            strokeThickness: 4
          });
          this.goldRushText.setOrigin(0.5);
          this.goldRushText.setScrollFactor(0);
          this.goldRushText.setDepth(1000);
        }
        this.goldRushText.setText(`Gold: ${Math.floor(this.gold)}/${this.goldGoal}`);
        
        // Spawn waves
        if (time - this.lastWaveSpawn > this.waveSpawnInterval) {
          this.spawnRomanWave();
          this.lastWaveSpawn = time;
        }
        
        // Check if goal reached
        if (this.gold >= this.goldGoal && !this.campaignComplete) {
          this.campaignComplete = true;
          if (!this.levelCompleted) {
            this.levelCompleted = true;
            const newProgress = this.alienLevel + 1;
            localStorage.setItem('alienCampaignProgress', newProgress.toString());
            this.registry.set('alienCampaignProgress', newProgress);
            console.log('ALIEN gold rush complete, saved:', newProgress);
          }
          this.time.delayedCall(1000, () => {
            this.gameOver(true);
          });
        }
        break;
        
      case 'alien_mind_control':
        // Show mind control counter
        if (!this.mindControlText) {
          const { width } = this.scale;
          this.mindControlText = this.add.text(width / 2, 100, '', {
            fontSize: '24px',
            fontFamily: 'Press Start 2P',
            color: '#FF00FF',
            stroke: '#000000',
            strokeThickness: 4
          });
          this.mindControlText.setOrigin(0.5);
          this.mindControlText.setScrollFactor(0);
          this.mindControlText.setDepth(1000);
        }
        this.mindControlText.setText(`Mind Controls: ${this.mindControlCount}/${this.mindControlGoal}`);
        
        // Check if goal reached
        if (this.mindControlCount >= this.mindControlGoal && !this.campaignComplete) {
          this.campaignComplete = true;
          if (!this.levelCompleted) {
            this.levelCompleted = true;
            const newProgress = this.alienLevel + 1;
            localStorage.setItem('alienCampaignProgress', newProgress.toString());
            this.registry.set('alienCampaignProgress', newProgress);
            console.log('ALIEN mind control complete, saved:', newProgress);
          }
          this.time.delayedCall(1000, () => {
            this.gameOver(true);
          });
        }
        break;
        
      case 'survive':
        this.survivalTimer += delta / 1000;
        // Update survival timer display
        const timeLeft = Math.ceil(this.survivalGoal - this.survivalTimer);
        if (!this.survivalText) {
          const { width } = this.scale;
          this.survivalText = this.add.text(width / 2, 100, '', {
            fontSize: '24px',
            fontFamily: 'Press Start 2P',
            color: '#FFD700',
            stroke: '#000000',
            strokeThickness: 4
          });
          this.survivalText.setOrigin(0.5);
          this.survivalText.setScrollFactor(0);
          this.survivalText.setDepth(1000);
        }
        this.survivalText.setText(`Survive: ${timeLeft}s`);
        
        // Spawn continuous waves
        if (time - this.lastWaveSpawn > this.waveSpawnInterval) {
          this.spawnAlienWave();
          this.lastWaveSpawn = time;
        }
        
        // Check if survived
        if (this.survivalTimer >= this.survivalGoal && !this.campaignComplete) {
          this.campaignComplete = true;
          // Save progress directly here
          if (!this.levelCompleted) {
            this.levelCompleted = true;
            if (this.vikingCampaign) {
              const newProgress = this.campaignLevel + 1;
              localStorage.setItem('vikingCampaignProgress', newProgress.toString());
              this.registry.set('vikingCampaignProgress', newProgress);
              console.log('VIKING survival complete, saved:', newProgress);
            } else if (this.alienCampaign) {
              const newProgress = this.alienLevel + 1;
              localStorage.setItem('alienCampaignProgress', newProgress.toString());
              this.registry.set('alienCampaignProgress', newProgress);
              console.log('ALIEN survival complete, saved:', newProgress);
            } else {
              const newProgress = this.campaignLevel + 1;
              localStorage.setItem('campaignProgress', newProgress.toString());
              this.registry.set('campaignProgress', newProgress);
              console.log('ROMAN survival complete, saved:', newProgress);
            }
          }
          this.time.delayedCall(1000, () => {
            this.gameOver(true);
          });
        }
        break;
        
      case 'cast_spells':
        // Check if all spells cast
        if (this.spellsCastThisLevel.lightning && 
            this.spellsCastThisLevel.heal && 
            this.spellsCastThisLevel.boost && 
            !this.campaignComplete) {
          this.campaignComplete = true;
          // Save progress directly here
          if (!this.levelCompleted) {
            this.levelCompleted = true;
            const newProgress = this.campaignLevel + 1;
            localStorage.setItem('campaignProgress', newProgress.toString());
            this.registry.set('campaignProgress', newProgress);
            console.log('ROMAN spell mastery complete, saved:', newProgress);
          }
          this.time.delayedCall(1000, () => {
            this.gameOver(true);
          });
        }
        break;
        
      case 'challenge_endless':
        // Endless Waves - spawn increasingly difficult waves
        const survivalTime = Math.floor((time - this.stats.startTime) / 1000);
        this.endlessSurvivalText.setText(`Time: ${survivalTime}s`);
        
        // Spawn waves
        if (time - this.lastEndlessWave > this.endlessSpawnInterval) {
          this.spawnEndlessWave();
          this.lastEndlessWave = time;
          this.endlessWaveNumber++;
          this.endlessWaveText.setText(`WAVE ${this.endlessWaveNumber}`);
          
          // Increase difficulty every 5 waves
          if (this.endlessWaveNumber % 5 === 0) {
            this.endlessUnitsPerWave++;
            this.endlessSpawnInterval = Math.max(2000, this.endlessSpawnInterval - 200);
          }
        }
        break;
        
      case 'challenge_goldrush':
        // Gold Rush - track time to collect 2000 gold
        this.goldRushProgress.setText(`${Math.floor(this.gold)} / ${this.goldGoal}`);
        
        if (this.gold >= this.goldGoal) {
          const completionTime = Math.floor((time - this.challengeStartTime) / 1000);
          this.completeChallengeMode('goldrush', completionTime);
        }
        break;
        
      case 'challenge_spellmaster':
        // Check if player trained any combat units (violation)
        const combatUnits = this.playerUnits.filter(u => 
          !u.isWorker && u.config.name !== 'Worker' && u.config.name !== 'Harvester' && u.config.name !== 'Thrall'
        );
        
        if (combatUnits.length > 0 && !this.spellMasterViolation) {
          this.spellMasterViolation = true;
          this.spellMasterText.setText('CHALLENGE FAILED!\nYou trained combat units!');
          this.spellMasterText.setColor('#FF0000');
          
          this.time.delayedCall(2000, () => {
            this.gameOver(false);
          });
        }
        
        // Win condition - destroy enemy base with spells only
        if (this.enemyBase && this.enemyBase.health <= 0 && !this.spellMasterViolation) {
          this.completeChallengeMode('spellmaster', 1);
        }
        break;
        
      case 'challenge_speedblitz':
        // Speed Blitz - destroy base before timer runs out
        const elapsedTime = Math.floor((time - this.challengeStartTime) / 1000);
        const remainingTime = this.speedBlitzTimeLimit - elapsedTime;
        
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        this.speedBlitzTimer.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        
        // Calculate progress (0 to 1, where 1 is full time remaining)
        const progress = remainingTime / this.speedBlitzTimeLimit;
        
        // Draw circular progress indicator
        const { width } = this.scale;
        const centerX = width / 2;
        const centerY = 140;
        const radius = 45;
        
        this.speedBlitzCircle.clear();
        
        // Determine color based on time remaining
        let circleColor = 0x00FF00; // Green
        let timerColor = '#FFFFFF';
        
        if (remainingTime <= 30) {
          circleColor = 0xFF0000; // Red
          timerColor = '#FF0000';
          // Show pulsing warning icon
          this.speedBlitzWarning.setVisible(true);
          this.speedBlitzWarning.setAlpha(0.5 + Math.sin(time / 200) * 0.5);
          // Pulse the circle background
          const pulseScale = 1 + Math.sin(time / 150) * 0.05;
          this.speedBlitzCircleBg.setScale(pulseScale);
        } else if (remainingTime <= 60) {
          circleColor = 0xFFAA00; // Orange
          timerColor = '#FFAA00';
          this.speedBlitzWarning.setVisible(false);
          this.speedBlitzCircleBg.setScale(1);
        } else {
          this.speedBlitzWarning.setVisible(false);
          this.speedBlitzCircleBg.setScale(1);
        }
        
        this.speedBlitzTimer.setColor(timerColor);
        
        // Draw the progress arc
        this.speedBlitzCircle.lineStyle(8, circleColor, 1);
        this.speedBlitzCircle.beginPath();
        
        // Draw arc from top (270 degrees) clockwise
        const startAngle = Phaser.Math.DegToRad(270);
        const endAngle = startAngle + (Phaser.Math.DegToRad(360) * progress);
        
        this.speedBlitzCircle.arc(centerX, centerY, radius, startAngle, endAngle, false);
        this.speedBlitzCircle.strokePath();
        
        // Show milestone notifications
        if (remainingTime <= 120 && !this.speedBlitzMilestones[120]) {
          this.speedBlitzMilestones[120] = true;
          this.showSpeedBlitzNotification('2 MINUTES LEFT!', '#FFAA00');
        } else if (remainingTime <= 60 && !this.speedBlitzMilestones[60]) {
          this.speedBlitzMilestones[60] = true;
          this.showSpeedBlitzNotification('1 MINUTE LEFT!', '#FF6600');
        } else if (remainingTime <= 30 && !this.speedBlitzMilestones[30]) {
          this.speedBlitzMilestones[30] = true;
          this.showSpeedBlitzNotification('30 SECONDS!', '#FF0000');
        }
        
        // Time's up - failure
        if (remainingTime <= 0) {
          this.speedBlitzTimer.setText('0:00');
          this.speedBlitzText.setText('TIME UP!');
          this.speedBlitzText.setColor('#FF0000');
          this.gameOver(false);
        }
        
        // Win condition - destroy base in time
        if (this.enemyBase && this.enemyBase.health <= 0) {
          this.completeChallengeMode('speedblitz', elapsedTime);
        }
        break;
    }
    
    // Note: Base destruction objectives are handled in Base.js die() method
    // This ensures progress is saved before gameOver() is called
  }
  
  updateAlienTutorialArrows() {
    if (!this.tutorialArrows || !this.tutorialSteps) return;
    
    // Update progress counter for current phase
    if (this.tutorialPhase === 'harvesters') {
      const step = this.tutorialSteps.harvesters;
      this.tutorialProgressText.setText(`${step.current}/${step.needed}`);
      
      // Move to next phase when harvesters complete
      if (step.current >= step.needed) {
        this.tutorialPhase = 'drones';
        this.tutorialMessageText.setText('Excellent.\nNow train DRONES to overwhelm the primitives.');
        this.tutorialArrow.x = 165; // Move arrow to drone button (second button)
        this.tutorialProgressText.x = 165;
        this.tutorialProgressText.setText('0/3');
      }
    } else if (this.tutorialPhase === 'drones') {
      const step = this.tutorialSteps.drones;
      this.tutorialProgressText.setText(`${step.current}/${step.needed}`);
      
      // Complete tutorial when drones trained
      if (step.current >= step.needed) {
        this.tutorialMessageText.setText('Acceptable. The invasion begins.');
        this.tutorialArrow.setVisible(false);
        this.tutorialProgressText.setVisible(false);
        this.campaignComplete = true;
      }
    }
  }
  
  spawnRomanWave() {
    // Spawn a wave of Roman units (for Alien campaign L3)
    const waveTypes = ['legionary', 'pilum'];
    const randomType = Phaser.Utils.Array.GetRandom(waveTypes);
    
    const unit = new Unit(
      this,
      CONFIG.ENEMY_BASE_X - 200,
      this.groundY - 40,
      CONFIG.UNITS[randomType],
      true,
      'roman'
    );
    this.enemyUnits.push(unit);
  }
  
  completeAlienCampaignLevel() {
    if (this.levelCompleted) return; // Prevent double trigger
    this.levelCompleted = true;
    
    // Unlock next level in alien campaign - FIXED (always unlock next)
    localStorage.setItem('alienCampaignProgress', (this.alienLevel + 1).toString());
    
    // Check for campaign completion achievement
    if (this.alienLevel === 6) {
      if (this.achievementManager) {
        this.achievementManager.checkAchievement('campaign_complete', 'alien');
      }
    }
    
    // Show victory after short delay
    this.time.delayedCall(1000, () => {
      this.gameOver(true);
    });
  }
  
  spawnEndlessWave() {
    // Spawn a wave with increasing difficulty
    const unitTypes = ['drone', 'blaster', 'overlord'];
    
    // First 10 waves: only drones and blasters
    // After wave 10: include overlords
    const availableTypes = this.endlessWaveNumber <= 10 
      ? unitTypes.slice(0, 2) 
      : unitTypes;
    
    for (let i = 0; i < this.endlessUnitsPerWave; i++) {
      const randomType = Phaser.Utils.Array.GetRandom(availableTypes);
      
      const unit = new Unit(
        this,
        CONFIG.ENEMY_BASE_X - 200 - (i * 80),
        this.groundY - 40,
        CONFIG.ALIEN_UNITS[randomType],
        true,
        'alien'
      );
      this.enemyUnits.push(unit);
    }
  }
  
  showSpeedBlitzNotification(message, color) {
    const { width } = this.scale;
    
    // Create notification text
    const notification = this.add.text(width / 2, 250, message, {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: color,
      stroke: '#000000',
      strokeThickness: 6,
    });
    notification.setOrigin(0.5);
    notification.setScrollFactor(0);
    notification.setDepth(1100);
    notification.setScale(0);
    
    // Animate in
    this.tweens.add({
      targets: notification,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // Fade out and destroy
        this.tweens.add({
          targets: notification,
          alpha: 0,
          duration: 500,
          delay: 1000,
          onComplete: () => {
            notification.destroy();
          }
        });
      }
    });
    
    // Play warning sound
    if (this.audioSystem) {
      this.audioSystem.playWarningBeep();
    }
  }
  
  completeChallengeMode(challengeId, score) {
    if (this.levelCompleted) return;
    this.levelCompleted = true;
    
    // Save high score if better than previous
    const currentBest = parseFloat(localStorage.getItem(`challenge_${challengeId}`) || '999999');
    
    if (challengeId === 'endless') {
      // For endless, higher is better (survival time)
      if (score > currentBest) {
        localStorage.setItem(`challenge_${challengeId}`, score.toString());
      }
    } else {
      // For timed challenges, lower is better
      if (score < currentBest) {
        localStorage.setItem(`challenge_${challengeId}`, score.toString());
      }
    }
    
    // For Speed Blitz, calculate and save star rating
    if (challengeId === 'speedblitz') {
      let stars = 1;
      if (score <= 90) stars = 3;
      else if (score <= 120) stars = 2;
      
      const bestStars = parseInt(localStorage.getItem('challenge_speedblitz_stars') || '0');
      if (stars > bestStars) {
        localStorage.setItem('challenge_speedblitz_stars', stars.toString());
      }
    }
    
    // Store score for victory screen
    this.challengeScore = score;
    
    // Show victory
    this.time.delayedCall(1000, () => {
      this.gameOver(true);
    });
  }
  
  spawnAlienWave() {
    // Spawn a small wave of aliens
    const waveTypes = ['drone', 'blaster'];
    const randomType = Phaser.Utils.Array.GetRandom(waveTypes);
    
    const unit = new Unit(
      this,
      CONFIG.ENEMY_BASE_X - 200,
      this.groundY - 40,
      CONFIG.ALIEN_UNITS[randomType],
      true
    );
    this.enemyUnits.push(unit);
  }
  
  completeCampaignLevel() {
    console.log('completeCampaignLevel() called. levelCompleted:', this.levelCompleted);
    if (this.levelCompleted) {
      console.log('Already completed, returning early');
      return; // Prevent double trigger
    }
    this.levelCompleted = true;
    
    // Handle different campaigns - SAVE TO LOCALSTORAGE SO IT PERSISTS
    if (this.vikingCampaign) {
      // Viking campaign
      const newProgress = this.campaignLevel + 1;
      localStorage.setItem('vikingCampaignProgress', newProgress.toString());
      this.registry.set('vikingCampaignProgress', newProgress);
      console.log('VIKING LEVEL COMPLETE - saved:', newProgress);
    } else {
      // Roman campaign (default)
      const newProgress = this.campaignLevel + 1;
      localStorage.setItem('campaignProgress', newProgress.toString());
      
      // Verify it saved
      const verifyRead = localStorage.getItem('campaignProgress');
      
      this.registry.set('campaignProgress', newProgress);
      
      console.log('=== CAMPAIGN LEVEL COMPLETE ===');
      console.log('Completed level:', this.campaignLevel);
      console.log('Tried to save:', newProgress);
      console.log('Verify read back:', verifyRead);
      console.log('Match:', verifyRead === newProgress.toString());
      console.log('============================');
    }
    
    // Show victory after short delay
    this.time.delayedCall(1000, () => {
      console.log('Calling gameOver(true)');
      this.gameOver(true);
    });
  }
  
  update(time, delta) {
    if (this.isGameOver) return;
    
    // Scale delta by game speed for actual game acceleration
    const scaledDelta = delta * this.gameSpeed;
    
    // Update stats
    this.stats.timeElapsed = time - this.stats.startTime;
    
    // Update campaign objectives
    if (this.campaignLevel) {
      this.updateCampaignObjectives(time, scaledDelta);
    }
    
    // Update camera
    this.updateCamera(scaledDelta);
    
    // Update gold display
    this.goldText.setText(`${Math.floor(this.gold)}`);
    
    // Track gold earned
    const currentGold = Math.floor(this.gold);
    if (currentGold > this.stats.goldEarned) {
      this.stats.goldEarned = currentGold;
    }
    
    // Update mana display
    this.manaText.setText(`${Math.floor(this.mana)}`);
    
    // Update player base health bar UI
    if (this.playerBaseHealthBarFill && this.playerBase && !this.playerBase.isDead) {
      this.uiManager.updateBaseHealthBar(
        'player',
        this.playerBase,
        this.playerBaseHealthBarFill,
        this.playerBaseHealthText,
        this.playerBaseLabel,
        this.playerBaseIcon,
        this.playerBaseShieldIcon
      );
      
      // Play alarm sound for critical health
      const healthPercent = this.playerBase.health / this.playerBase.maxHealth;
      if (healthPercent <= 0.25) {
        if (this.audioSystem && !this.lastPlayerBaseAlarm) {
          this.audioSystem.playWarningBeep();
          this.lastPlayerBaseAlarm = time;
        } else if (this.audioSystem && time - this.lastPlayerBaseAlarm > 3000) {
          this.audioSystem.playWarningBeep();
          this.lastPlayerBaseAlarm = time;
        }
      }
    }
    
    // Update enemy base health bar UI
    if (this.enemyBaseHealthBarFill && this.enemyBase && !this.enemyBase.isDead) {
      this.uiManager.updateBaseHealthBar(
        'enemy',
        this.enemyBase,
        this.enemyBaseHealthBarFill,
        this.enemyBaseHealthText,
        this.enemyBaseLabel,
        this.enemyBaseIcon,
        null // No shield icon for enemy base
      );
      
      const healthPercent = Math.max(0, this.enemyBase.health / this.enemyBase.maxHealth);
      
      // Keep existing logic after health percentage calculation
      if (healthPercent <= 0.25) {
        this.enemyBaseHealthText.setColor('#FF0000');
        // Pulse animation when critical
        if (!this.enemyBaseHealthPulsing) {
          this.enemyBaseHealthPulsing = true;
          this.tweens.add({
            targets: [this.enemyBaseIcon, this.enemyBaseLabel],
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      } else if (healthPercent <= 0.5) {
        this.enemyBaseHealthBarFill.setFillStyle(0xFF6600); // Warning orange
        this.enemyBaseHealthText.setColor('#FFAA00');
        if (this.enemyBaseHealthPulsing) {
          this.tweens.killTweensOf([this.enemyBaseIcon, this.enemyBaseLabel]);
          this.enemyBaseIcon.setAlpha(1);
          this.enemyBaseLabel.setAlpha(1);
          this.enemyBaseHealthPulsing = false;
        }
      } else {
        this.enemyBaseHealthBarFill.setFillStyle(0xFF3333); // Normal red
        this.enemyBaseHealthText.setColor('#FFFFFF');
        if (this.enemyBaseHealthPulsing) {
          this.tweens.killTweensOf([this.enemyBaseIcon, this.enemyBaseLabel]);
          this.enemyBaseIcon.setAlpha(1);
          this.enemyBaseLabel.setAlpha(1);
          this.enemyBaseHealthPulsing = false;
        }
      }
    }
    
    // Generate mana from aqueduct
    if (this.aqueduct) {
      const manaGain = this.aqueduct.getManaRate() * (scaledDelta / 1000);
      this.mana = Math.min(CONFIG.MAX_MANA, this.mana + manaGain);
      
      // Show mana gain text every 2 seconds
      if (!this.lastManaTextTime) this.lastManaTextTime = 0;
      if (time - this.lastManaTextTime >= 2000) {
        const totalGain = this.aqueduct.getManaRate() * 2;
        this.showManaGainText(this.aqueduct.x, this.aqueduct.y - 60, totalGain);
        this.lastManaTextTime = time;
      }
      
      // Update aqueduct particles
      this.aqueduct.update(time, delta);
    }
    
    // Update cooldowns (use scaledDelta to respect game speed)
    Object.keys(this.unitCooldowns).forEach(key => {
      if (this.unitCooldowns[key] > 0) {
        this.unitCooldowns[key] -= scaledDelta;
      }
    });
    
    // Update probe beam cooldown
    if (this.probeBeamCooldown > 0) {
      this.probeBeamCooldown -= scaledDelta;
    }
    
    // Update spell cooldowns
    Object.keys(this.spellCooldowns).forEach(key => {
      if (this.spellCooldowns[key] > 0) {
        this.spellCooldowns[key] -= scaledDelta;
      }
    });
    
    // Update alien spell cooldowns
    Object.keys(this.alienSpellCooldowns).forEach(key => {
      if (this.alienSpellCooldowns[key] > 0) {
        this.alienSpellCooldowns[key] -= scaledDelta;
      }
    });
    
    // Update button states
    this.updateButtonStates();
    
    // Update units (dead units are removed immediately in Unit.die())
    this.playerUnits.forEach(unit => unit.update(time, scaledDelta));
    this.enemyUnits.forEach(unit => unit.update(time, scaledDelta));
    
    // Update minimap
    if (this.minimap) {
      this.minimap.update();
    }
    
    // Update fog of war
    this.updateFogOfWar();
    
    // Update battle intensity and music volume (every 200ms for smooth transitions)
    if (time - this.lastIntensityUpdate >= 200) {
      this.calculateBattleIntensity();
      this.updateCombatMusicVolume();
      this.updateIntensityIndicator();
      this.lastIntensityUpdate = time;
    }
    
    // AI spawning (with campaign difficulty and skirmish adjustments)
    if (!this.disableAI) {
      let aiInterval = CONFIG.AI_SPAWN_INTERVAL;
      let aiChance = CONFIG.AI_SPAWN_CHANCE;
      
      // Skirmish multiplier
      if (this.aiSpawnMultiplier) {
        aiInterval = CONFIG.AI_SPAWN_INTERVAL * this.aiSpawnMultiplier;
      }
      
      // Campaign difficulty
      if (this.aiDifficulty === 'easy') {
        aiInterval = CONFIG.AI_SPAWN_INTERVAL * 2; // Slower spawning
        aiChance = CONFIG.AI_SPAWN_CHANCE * 0.5; // Less frequent
      } else if (this.aiDifficulty === 'hard') {
        aiInterval = CONFIG.AI_SPAWN_INTERVAL * 0.7; // Faster spawning
        aiChance = CONFIG.AI_SPAWN_CHANCE * 1.3; // More frequent
      } else if (this.aiDifficulty === 'boss') {
        aiInterval = CONFIG.AI_SPAWN_INTERVAL * 0.5; // Very fast
        aiChance = CONFIG.AI_SPAWN_CHANCE * 1.5; // Very frequent
      }
      
      if (time - this.lastAISpawn >= aiInterval) {
        if (Math.random() < aiChance) {
          this.spawnEnemyUnit();
        }
        this.lastAISpawn = time;
      }
    }
    
    // AI Probe Beam usage (sacrifice low HP units for mana)
    if (time - this.lastAIProbeBeam >= CONFIG.AI_PROBE_BEAM_INTERVAL) {
      this.aiProbeBeam();
      this.lastAIProbeBeam = time;
    }
    
    // AI Spell casting (disabled in some campaign levels)
    if (!this.aiSpellsEnabled && this.campaignLevel) {
      // Spells disabled for this level
    } else if (time - this.lastAISpellCheck >= CONFIG.AI_SPELL_CHECK_INTERVAL) {
      this.aiCastSpells();
      this.lastAISpellCheck = time;
    }
    
    // AI Upgrade purchasing
    if (time - this.lastAIUpgradeCheck >= CONFIG.AI_UPGRADE_CHECK_INTERVAL) {
      this.aiPurchaseUpgrades();
      this.lastAIUpgradeCheck = time;
    }
    
    // AI Scout spawning
    if (!this.disableAI && time - this.lastAIScoutSpawn >= CONFIG.AI_SCOUT_INTERVAL) {
      this.aiSpawnScout();
      this.lastAIScoutSpawn = time;
    }
  }
  
  aiPurchaseUpgrades() {
    // Skirmish: Check if upgrades are disabled
    if (this.skirmishDifficulty && !this.aiUpgradesEnabled) return;
    
    // Only buy upgrades when AI has excess gold
    if (this.enemyGold < CONFIG.AI_UPGRADE_GOLD_THRESHOLD) return;
    
    // Priority order for alien upgrades
    const upgradeOrder = [
      { key: 'cloningVats', config: CONFIG.ALIEN_UPGRADES.cloningVats },
      { key: 'plasmaInfusion', config: CONFIG.ALIEN_UPGRADES.plasmaInfusion },
      { key: 'exoskeleton', config: CONFIG.ALIEN_UPGRADES.exoskeleton },
      { key: 'warpDrive', config: CONFIG.ALIEN_UPGRADES.warpDrive },
    ];
    
    // Count purchased upgrades for skirmish max check
    const purchasedCount = Object.values(this.alienUpgrades).filter(v => v).length;
    if (this.aiMaxUpgrades && purchasedCount >= this.aiMaxUpgrades) return;
    
    for (const upgrade of upgradeOrder) {
      if (!this.alienUpgrades[upgrade.key] && this.enemyGold >= upgrade.config.cost) {
        this.purchaseUpgrade('alien', upgrade.key);
        
        // Mark mana source as built when buying first upgrade
        if (upgrade.key === 'cloningVats') {
          this.aiManaSourceBuilt = true;
        }
        
        return;  // Only buy one upgrade per check
      }
    }
  }
  
  aiCastSpells() {
    // Check if AI has enough mana to cast spells
    if (this.enemyMana < 45) return;
    
    // Priority 1: Cast damage spells on player clusters of 3+ units
    if (this.alienSpellCooldowns.plasmaBomb <= 0 && this.enemyMana >= CONFIG.PLASMA_BOMB.cost) {
      // First check scouted locations for clusters
      let cluster = null;
      
      if (this.aiScoutTargets.length > 0) {
        // Use scout intel to find clusters in known locations
        cluster = this.findClusterFromScoutData();
      }
      
      // Fallback to searching all player units
      if (!cluster) {
        cluster = this.findUnitCluster(this.playerUnits, 3, 150); // Look for 3+ units
      }
      
      if (cluster) {
        this.enemyMana -= CONFIG.PLASMA_BOMB.cost;
        this.alienSpellCooldowns.plasmaBomb = CONFIG.PLASMA_BOMB.cooldown;
        this.castPlasmaBomb(cluster.x, cluster.y);
        return;  // Only cast one spell per check
      }
    }
    
    // Priority 2: Use heal/buff spells on own units in fights
    // Check if AI units are in combat (near player units)
    const unitsInCombat = this.enemyUnits.filter(aiUnit => {
      if (aiUnit.isDead || aiUnit.isWorker) return false;
      return this.playerUnits.some(playerUnit => {
        if (playerUnit.isDead) return false;
        const dist = Phaser.Math.Distance.Between(aiUnit.x, aiUnit.y, playerUnit.x, playerUnit.y);
        return dist < 300; // Within combat range
      });
    });
    
    // If units in combat and some are injured, try to heal
    if (unitsInCombat.length >= 2) {
      const injuredUnits = unitsInCombat.filter(u => u.health < u.maxHealth * 0.6);
      if (injuredUnits.length > 0 && this.alienSpellCooldowns.mindControl <= 0 && this.enemyMana >= 40) {
        // Use a buff/heal ability on combat cluster
        const combatCenter = this.findUnitCluster(unitsInCombat, 2, 120);
        if (combatCenter) {
          // Cast a defensive spell (would need to add alien heal spell)
          // For now, save mana for damage spells
        }
      }
    }
    
    // Try to cast Mind Control on expensive player units
    if (this.alienSpellCooldowns.mindControl <= 0 && this.enemyMana >= CONFIG.MIND_CONTROL.cost) {
      const expensiveUnits = this.playerUnits.filter(unit => {
        if (unit.isDead || unit.mindControlled || unit.isWorker) return false;
        // Target Centurions (200 gold), Pilum Throwers (100 gold)
        return unit.config.cost >= CONFIG.AI_MIND_CONTROL_MIN_COST;
      });
      
      if (expensiveUnits.length > 0) {
        // Pick the most expensive unit closest to the front
        const target = expensiveUnits.reduce((best, unit) => {
          if (!best) return unit;
          // Prefer units further right (closer to alien base)
          if (unit.x > best.x) return unit;
          // Or more expensive units
          if (unit.config.cost > best.config.cost) return unit;
          return best;
        }, null);
        
        if (target) {
          this.enemyMana -= CONFIG.MIND_CONTROL.cost;
          this.alienSpellCooldowns.mindControl = CONFIG.MIND_CONTROL.cooldown;
          this.castMindControl(target);
        }
      }
    }
  }
  
  findUnitCluster(units, minCount, radius) {
    // Find a position where at least minCount units are clustered
    for (let i = 0; i < units.length; i++) {
      const centerUnit = units[i];
      if (centerUnit.isDead) continue;
      
      let count = 0;
      for (let j = 0; j < units.length; j++) {
        if (units[j].isDead) continue;
        const dist = Phaser.Math.Distance.Between(
          centerUnit.x, centerUnit.y,
          units[j].x, units[j].y
        );
        if (dist <= radius) count++;
      }
      
      if (count >= minCount) {
        return { x: centerUnit.x, y: centerUnit.y };
      }
    }
    
    return null;
  }
  
  findClusterFromScoutData() {
    // Use scout intelligence to find clustered units
    // Filter out stale data (older than 5 seconds)
    const now = Date.now();
    const recentScouts = this.aiScoutTargets.filter(s => now - s.timestamp < 5000);
    
    if (recentScouts.length < 3) return null;
    
    // Find a cluster of 3+ scouted units
    for (let i = 0; i < recentScouts.length; i++) {
      const center = recentScouts[i];
      let nearbyCount = 0;
      
      for (let j = 0; j < recentScouts.length; j++) {
        const dist = Phaser.Math.Distance.Between(
          center.x, center.y,
          recentScouts[j].x, recentScouts[j].y
        );
        if (dist <= 150) nearbyCount++;
      }
      
      if (nearbyCount >= 3) {
        return { x: center.x, y: center.y };
      }
    }
    
    return null;
  }
  
  aiProbeBeam() {
    // Find low HP enemy units to sacrifice
    const sacrificeableUnits = this.enemyUnits.filter(unit => 
      !unit.isDead && 
      unit.health < CONFIG.AI_PROBE_BEAM_HP_THRESHOLD &&
      unit.health > 5  // Don't bother with nearly dead units
    );
    
    if (sacrificeableUnits.length > 0 && this.enemyMana < CONFIG.MAX_MANA * 0.8) {
      // Pick a random low HP unit to sacrifice
      const target = sacrificeableUnits[Math.floor(Math.random() * sacrificeableUnits.length)];
      
      // Execute probe beam on enemy unit (AI uses it on its own units)
      const manaGain = Math.floor(target.health);
      this.enemyMana = Math.min(CONFIG.MAX_MANA, this.enemyMana + manaGain);
      
      // Visual effect
      const beam = this.add.rectangle(target.x, target.y - 100, 30, 200, CONFIG.COLORS.probeBeam, 0.5);
      beam.setDepth(500);
      
      // Animate unit being pulled up
      this.tweens.add({
        targets: target,
        y: target.y - 150,
        alpha: 0,
        scale: target.scale * 0.5,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          target.isDead = true;
          target.destroy();
        }
      });
      
      // Animate beam
      this.tweens.add({
        targets: beam,
        alpha: 0,
        duration: 800,
        ease: 'Power2',
        onComplete: () => {
          beam.destroy();
        }
      });
      
      // "Bloop" sound effect
      if (typeof Tone !== 'undefined') {
        AudioManager.playSFX(() => {
          const synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.1 }
          }).toDestination();
          synth.triggerAttackRelease('E5', '0.3');
        });
      }
    }
  }
  
  aiSpawnScout() {
    // Count active AI scouts
    const scoutCount = this.enemyUnits.filter(u => 
      !u.isDead && u.config.name === 'Scout'
    ).length;
    
    // Don't spawn if at max capacity or can't afford
    if (scoutCount >= CONFIG.AI_SCOUT_MAX) return;
    
    const scoutConfig = CONFIG.ALIEN_UNITS.scout;
    if (this.enemyGold < scoutConfig.cost) return;
    
    // Random chance to spawn scout
    if (Math.random() > CONFIG.AI_SCOUT_CHANCE) return;
    
    // Spawn the scout
    this.enemyGold -= scoutConfig.cost;
    
    const scout = new Unit(
      this,
      CONFIG.ENEMY_BASE_X - 150,
      this.groundY - 40,
      scoutConfig,
      true
    );
    
    // Mark as AI scout for special behavior
    scout.isAIScout = true;
    scout.scoutingPhase = 'explore'; // 'explore' or 'monitor'
    scout.lastScoutReport = 0;
    
    this.enemyUnits.push(scout);
    this.applyUpgradeBonuses(scout, 'alien');
    
    // Spawn animation
    scout.setScale(0);
    this.tweens.add({
      targets: scout,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });
  }
  
  updateButtonStates() {
    // Update unit buttons with progress fill
    this.unitButtons.forEach(({ key, button, progressFill, maxCooldown }) => {
      const config = CONFIG.UNITS[key];
      const canAfford = this.canAfford(config.cost);
      const cooldownRemaining = this.unitCooldowns[key];
      const onCooldown = cooldownRemaining > 0;
      
      // Campaign restrictions
      let disabled = false;
      if (this.disableTraining) {
        disabled = true; // Level 4 - no training allowed
      } else if (this.disableWorkers && key === 'worker') {
        disabled = true; // Level 6 - no workers allowed
      }
      
      // Show/hide progress fill
      if (disabled) {
        progressFill.setVisible(false);
        button.setAlpha(0.3);
      } else if (onCooldown) {
        progressFill.setVisible(true);
        const progress = 1 - (cooldownRemaining / maxCooldown);
        progressFill.width = 50 * progress;  // Fill from left to right
        button.setAlpha(0.7);
      } else {
        progressFill.setVisible(false);
        button.setAlpha(canAfford ? 1 : 0.5);
      }
    });
    
    // Update probe beam cooldown display (only if it exists)
    if (this.probeCooldownOverlay && this.probeCooldownBar) {
      if (this.probeBeamCooldown > 0) {
        this.probeCooldownOverlay.setVisible(true);
        this.probeCooldownBar.setVisible(true);
        
        const progress = 1 - (this.probeBeamCooldown / CONFIG.PROBE_BEAM_COOLDOWN);
        this.probeCooldownBar.width = 80 * progress;
      } else {
        this.probeCooldownOverlay.setVisible(false);
        this.probeCooldownBar.setVisible(false);
      }
    }
    
    // Update aqueduct button state
    if (this.aqueductButton) {
      if (this.aqueductButtonState === 'build') {
        // Building state - check if can afford 100 gold
        if (this.canAfford(CONFIG.AQUEDUCT_COST)) {
          this.aqueductButton.setAlpha(1);
        } else {
          this.aqueductButton.setAlpha(0.6);
        }
      } else if (this.aqueductButtonState === 'upgrade') {
        // Upgrade state - check if can afford 150 gold
        if (this.canAfford(CONFIG.AQUEDUCT_UPGRADE_COST)) {
          this.aqueductButton.setAlpha(1);
        } else {
          this.aqueductButton.setAlpha(0.6);
        }
      } else if (this.aqueductButtonState === 'upgraded') {
        // Fully upgraded - grey out
        this.aqueductButton.setAlpha(0.5);
      }
    }
    
    // Update spell button cooldown displays with radial overlay
    if (this.spellButtons) {
      Object.entries(this.spellButtons).forEach(([spellKey, spellButton]) => {
        const cooldown = this.spellCooldowns[spellKey] || 0;
        const maxCooldown = this.getSpellMaxCooldown(spellKey);
        
        if (cooldown > 0 && maxCooldown > 0) {
          // Draw radial cooldown overlay
          this.drawRadialCooldown(spellButton, cooldown, maxCooldown);
          spellButton.button.setAlpha(0.5);
        } else {
          // Clear cooldown display
          spellButton.cooldownOverlay.clear();
          spellButton.cooldownOverlay.setVisible(false);
          spellButton.cooldownText.setVisible(false);
          
          const cost = this.getSpellCost(spellKey);
          spellButton.button.setAlpha(this.mana >= cost ? 1 : 0.5);
        }
      });
    }
    
    // Update upgrade button states with checkmarks
    if (this.upgradeButtons) {
      // Roman Armor
      const armorBtn = this.upgradeButtons.roman_armor;
      if (armorBtn) {
        armorBtn.checkmark.setVisible(this.romanUpgrades.armor);
        armorBtn.button.setAlpha(this.romanUpgrades.armor ? 0.5 : (this.canAfford(CONFIG.ROMAN_UPGRADES.armor.cost) ? 1 : 0.5));
      }
      
      // Roman Weapon
      const weaponBtn = this.upgradeButtons.roman_weapon;
      if (weaponBtn) {
        weaponBtn.checkmark.setVisible(this.romanUpgrades.weapon);
        weaponBtn.button.setAlpha(this.romanUpgrades.weapon ? 0.5 : (this.canAfford(CONFIG.ROMAN_UPGRADES.weapon.cost) ? 1 : 0.5));
      }
    }
    
    // Update aqueduct upgrade state
    if (this.aqueductButtonState === 'upgrade' && this.aqueduct) {
      this.aqueductIcon.setText('⬆️');
      this.aqueductCostText.setText('150');
    } else if (this.aqueductButtonState === 'upgraded') {
      this.aqueductIcon.setText('✓');
      this.aqueductCostText.setVisible(false);
    }
  }
  
  gameOver(playerWon) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    
    // Finalize stats
    this.stats.timeElapsed = this.time.now - this.stats.startTime;
    
    // For Endless mode, save score even on defeat
    if (this.campaignObjective === 'challenge_endless' && !playerWon) {
      const survivalTime = Math.floor(this.stats.timeElapsed / 1000);
      const currentBest = parseFloat(localStorage.getItem('challenge_endless') || '0');
      
      if (survivalTime > currentBest) {
        localStorage.setItem('challenge_endless', survivalTime.toString());
      }
      
      // Store for defeat screen
      this.challengeScore = survivalTime;
      this.stats.challengeScore = survivalTime;
      this.stats.waveReached = this.endlessWaveNumber - 1;
    }
    
    // Fade out and transition to result screen
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (playerWon) {
        this.scene.start('VictoryScene', { stats: this.stats, challengeMode: this.challengeMode, challengeScore: this.challengeScore });
      } else {
        this.scene.start('DefeatScene', { stats: this.stats, challengeMode: this.challengeMode, challengeScore: this.challengeScore });
      }
    });
  }
  
  shutdown() {
    // Clean up event listeners
    if (this.input && this.input.keyboard) {
      this.input.keyboard.removeAllListeners();
    }
    
    // Clean up audio context if needed
    if (this.audioSystem && this.audioSystem.audioContext) {
      // Note: Audio context cleanup handled by AudioSystem itself
    }
    
    // Kill all tweens
    this.tweens.killAll();
    
    // Clear unit arrays
    this.playerUnits = [];
    this.enemyUnits = [];
    
    // Remove minimap listeners
    if (this.minimap && this.minimap.bg) {
      this.minimap.bg.removeAllListeners();
    }
    
    // Clear timers
    if (this.fogUpdateTimer) {
      this.fogUpdateTimer.remove();
    }
    
    // Stop combat music
    this.stopCombatMusic();
  }
  
  startCombatMusic() {
    // Only start if music is enabled
    if (!AudioManager.shouldPlayMusic()) {
      return;
    }
    
    // Get the menu music from the menu scene if it exists
    const menuScene = this.scene.get('MenuScene');
    let menuMusic = null;
    if (menuScene && menuScene.menuMusic && menuScene.menuMusic.isPlaying) {
      menuMusic = menuScene.menuMusic;
    }
    
    // Ensure audio context is resumed
    if (this.sound.context && this.sound.context.state === 'suspended') {
      this.sound.context.resume().then(() => {
        this.playCombatMusic(menuMusic);
      });
    } else {
      this.playCombatMusic(menuMusic);
    }
  }
  
  playCombatMusic(menuMusic) {
    // Create combat music
    if (!this.combatMusic) {
      this.combatMusic = this.sound.add('battle-music', {
        loop: true,
        volume: 0 // Start at 0 for fade-in
      });
      
      // Add error handling
      this.combatMusic.once('looped', () => {
        this.updateCombatMusicVolume();
      });
    }
    
    // Start playing combat music
    this.combatMusic.play();
    
    // Cross-fade: fade out menu music and fade in combat music
    const fadeDuration = 2000; // 2 seconds
    
    if (menuMusic) {
      // Fade out menu music
      this.tweens.add({
        targets: menuMusic,
        volume: 0,
        duration: fadeDuration,
        ease: 'Linear',
        onComplete: () => {
          // Stop menu music after fade
          if (menuMusic.isPlaying) {
            menuMusic.stop();
          }
        }
      });
    }
    
    // Fade in combat music
    const targetVolume = AudioManager.getEffectiveVolume('music');
    this.tweens.add({
      targets: this.combatMusic,
      volume: targetVolume,
      duration: fadeDuration,
      ease: 'Linear'
    });
    
    // Add music watchdog - check every 3 seconds
    this.musicWatchdog = this.time.addEvent({
      delay: 3000,
      callback: () => {
        if (AudioManager.shouldPlayMusic()) {
          if (!this.combatMusic || !this.combatMusic.isPlaying) {
            console.log('Combat music stopped unexpectedly, restarting...');
            this.startCombatMusic();
          }
        }
      },
      loop: true
    });
  }
  
  updateCombatMusicVolume() {
    if (this.combatMusic) {
      const baseEffectiveVolume = AudioManager.getEffectiveVolume('music');
      
      // Apply battle intensity boost
      const intensityBoost = this.battleIntensity * this.maxVolumeBoost;
      const finalVolume = Math.min(1.0, baseEffectiveVolume + intensityBoost);
      
      this.combatMusic.setVolume(finalVolume);
      
      // Pause if volume is 0 or music disabled
      if (baseEffectiveVolume === 0 && this.combatMusic.isPlaying) {
        this.combatMusic.pause();
      } else if (baseEffectiveVolume > 0 && !this.combatMusic.isPlaying) {
        this.combatMusic.resume();
      }
    }
  }
  
  calculateBattleIntensity() {
    // Count units actively engaged in combat
    let unitsInCombat = 0;
    const combatRange = 400; // Distance to be considered "in combat"
    
    // Check player units engaging with enemy units
    this.playerUnits.forEach(playerUnit => {
      if (playerUnit.isDead || playerUnit.isWorker) return;
      
      // Check if this unit is near any enemy
      const hasNearbyEnemy = this.enemyUnits.some(enemyUnit => {
        if (enemyUnit.isDead) return false;
        const dist = Phaser.Math.Distance.Between(
          playerUnit.x, playerUnit.y, 
          enemyUnit.x, enemyUnit.y
        );
        return dist < combatRange;
      });
      
      if (hasNearbyEnemy) {
        unitsInCombat++;
      }
    });
    
    // Check enemy units engaging with player units (avoid double counting)
    this.enemyUnits.forEach(enemyUnit => {
      if (enemyUnit.isDead || enemyUnit.isWorker) return;
      
      const hasNearbyPlayer = this.playerUnits.some(playerUnit => {
        if (playerUnit.isDead) return false;
        const dist = Phaser.Math.Distance.Between(
          enemyUnit.x, enemyUnit.y, 
          playerUnit.x, playerUnit.y
        );
        return dist < combatRange;
      });
      
      if (hasNearbyPlayer) {
        unitsInCombat++;
      }
    });
    
    // Calculate intensity based on combat units (scale 0-1)
    // Full intensity at 20+ units in combat
    const maxCombatUnits = 20;
    let rawIntensity = Math.min(1.0, unitsInCombat / maxCombatUnits);
    
    // Smooth intensity changes (ease in/out)
    const smoothingFactor = 0.05; // Lower = smoother transitions
    this.battleIntensity += (rawIntensity - this.battleIntensity) * smoothingFactor;
    
    // Clamp to 0-1 range
    this.battleIntensity = Math.max(0, Math.min(1, this.battleIntensity));
    
    return this.battleIntensity;
  }
  
  updateIntensityIndicator() {
    if (!this.intensityBarFill || !this.intensityIcon) return;
    
    const barWidth = 96; // Max fill width (100 - 4 for padding)
    const fillWidth = barWidth * this.battleIntensity;
    
    // Update bar fill width
    this.intensityBarFill.setDisplaySize(fillWidth, 4);
    
    // Color transition: yellow (0) -> orange (0.5) -> red (1.0)
    let color;
    if (this.battleIntensity < 0.5) {
      // Yellow to orange
      const t = this.battleIntensity * 2; // 0 to 1
      color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 170, b: 0 },  // Yellow
        { r: 255, g: 100, b: 0 },  // Orange
        1, t
      );
    } else {
      // Orange to red
      const t = (this.battleIntensity - 0.5) * 2; // 0 to 1
      color = Phaser.Display.Color.Interpolate.ColorWithColor(
        { r: 255, g: 100, b: 0 },  // Orange
        { r: 255, g: 0, b: 0 },    // Red
        1, t
      );
    }
    
    const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
    this.intensityBarFill.setFillStyle(hexColor);
    
    // Show/pulse music icon when intensity is high (> 0.6)
    if (this.battleIntensity > 0.6) {
      this.intensityIcon.setAlpha(this.battleIntensity); // Fade in with intensity
      
      // Add pulse effect at max intensity
      if (this.battleIntensity > 0.9 && !this.intensityIconPulsing) {
        this.intensityIconPulsing = true;
        this.tweens.add({
          targets: this.intensityIcon,
          scale: 1.3,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else {
      this.intensityIcon.setAlpha(0);
      
      // Stop pulse if active
      if (this.intensityIconPulsing) {
        this.tweens.killTweensOf(this.intensityIcon);
        this.intensityIcon.setScale(1);
        this.intensityIconPulsing = false;
      }
    }
  }
  
  stopCombatMusic() {
    // Stop watchdog
    if (this.musicWatchdog) {
      this.musicWatchdog.remove();
      this.musicWatchdog = null;
    }
    
    // Stop intensity icon pulse if active
    if (this.intensityIconPulsing && this.intensityIcon) {
      this.tweens.killTweensOf(this.intensityIcon);
      this.intensityIcon.setScale(1);
      this.intensityIconPulsing = false;
    }
    
    if (this.combatMusic && this.combatMusic.isPlaying) {
      // Fade out before stopping
      this.tweens.add({
        targets: this.combatMusic,
        volume: 0,
        duration: 1000,
        ease: 'Linear',
        onComplete: () => {
          if (this.combatMusic) {
            this.combatMusic.stop();
            this.combatMusic.destroy();
            this.combatMusic = null;
          }
        }
      });
    } else if (this.combatMusic) {
      this.combatMusic.destroy();
      this.combatMusic = null;
    }
  }
}
