// Game configuration and constants
export const CONFIG = {
  // World settings
  WORLD_WIDTH: 6000,
  PLAYER_BASE_X: 100,
  ENEMY_BASE_X: 5700,
  
  // Camera settings
  CAMERA_WIDTH: 1500,
  CAMERA_SCROLL_SPEED: 400,  // pixels per second
  CAMERA_EDGE_ZONE: 50,      // pixels from edge to start scrolling
  
  // Base settings
  BASE_MAX_HEALTH: 100,
  BASE_Y_OFFSET: 120,  // How high above ground bases float
  
  // Unit stats
  UNITS: {
    worker: {
      name: 'Worker',
      health: 30,
      damage: 0,
      attackRange: 0,
      attackSpeed: 0,
      speed: 60,
      cost: 50,
      cooldown: 2000,
    },
    legionary: {
      name: 'Legionary',
      health: 80,
      damage: 12,
      attackRange: 100,
      attackSpeed: 1000,
      speed: 70,
      cost: 75,
      cooldown: 4000,  // 4 second training time
    },
    pilum: {
      name: 'Pilum Thrower',
      health: 45,
      damage: 18,
      attackRange: 280,
      attackSpeed: 1500,
      speed: 85,
      cost: 100,
      cooldown: 5000,  // 5 second training time
    },
    centurion: {
      name: 'Centurion',
      health: 200,
      damage: 25,
      attackRange: 110,
      attackSpeed: 1200,
      speed: 50,  // Slower movement
      cost: 200,
      cooldown: 8000,  // 8 second training time
    },
    scout: {
      name: 'Scout',
      health: 50,
      damage: 5,
      attackRange: 80,
      attackSpeed: 1000,
      speed: 120,  // Very fast movement
      cost: 60,
      cooldown: 3000,  // 3 second training time
      visionMultiplier: 1.6,  // 60% increased vision
    }
  },
  
  // Alien units (AI opponent faction)
  ALIEN_UNITS: {
    harvester: {
      name: 'Harvester',
      health: 30,
      damage: 0,
      attackRange: 0,
      attackSpeed: 0,
      speed: 70,
      cost: 50,
      cooldown: 3000,
    },
    scout: {
      name: 'Scout',
      health: 45,
      damage: 3,
      attackRange: 70,
      attackSpeed: 900,
      speed: 130,  // Very fast movement
      cost: 55,
      cooldown: 3000,
      visionMultiplier: 1.7,  // 70% increased vision
    },
    drone: {
      name: 'Drone',
      health: 40,
      damage: 8,
      attackRange: 90,
      attackSpeed: 800,
      speed: 95,  // Fast
      cost: 40,
      cooldown: 2500,
    },
    blaster: {
      name: 'Blaster',
      health: 50,
      damage: 20,
      attackRange: 300,
      attackSpeed: 1800,
      speed: 75,
      cost: 100,
      cooldown: 5000,
    },
    overlord: {
      name: 'Overlord',
      health: 180,
      damage: 30,
      attackRange: 120,
      attackSpeed: 1300,
      speed: 45,  // Slow
      cost: 225,
      cooldown: 9000,
    }
  },
  
  // Viking units (third playable faction)
  VIKING_UNITS: {
    thrall: {
      name: 'Thrall',
      health: 25,
      damage: 0,
      attackRange: 0,
      attackSpeed: 0,
      speed: 70,
      cost: 45,
      cooldown: 3000,
    },
    berserker: {
      name: 'Berserker',
      health: 70,
      damage: 14,
      attackRange: 100,
      attackSpeed: 900,
      speed: 100,  // Fast
      cost: 65,
      cooldown: 3500,
    },
    axeThrower: {
      name: 'Axe Thrower',
      health: 40,
      damage: 16,
      attackRange: 280,
      attackSpeed: 1600,
      speed: 80,
      cost: 95,
      cooldown: 5000,
    },
    jarl: {
      name: 'Jarl',
      health: 190,
      damage: 28,
      attackRange: 115,
      attackSpeed: 1400,
      speed: 50,  // Slow
      cost: 210,
      cooldown: 8000,
    }
  },
  
  // Resources
  STARTING_GOLD: 100,
  STARTING_MANA: 50,
  MAX_MANA: 200,
  
  // Mana structures
  AQUEDUCT_COST: 100,
  AQUEDUCT_MANA_RATE: 2,  // mana per second
  AQUEDUCT_UPGRADE_COST: 150,
  AQUEDUCT_UPGRADED_RATE: 4,  // mana per second when upgraded
  
  // Probe Beam (Alien mana ability)
  PROBE_BEAM_COOLDOWN: 5000,  // 5 seconds
  
  // Viking mana system (Odin's Blessing)
  ODINS_BLESSING_COST: 100,
  ODINS_BLESSING_MANA_RATE: 3,  // mana per second
  ODINS_BLESSING_UPGRADE_COST: 150,
  ODINS_BLESSING_UPGRADED_RATE: 5,  // mana per second when upgraded
  
  // Roman Spells
  SHIELD_WALL: {
    cost: 30,
    cooldown: 12000,
    duration: 5000,
    damageReduction: 0.5,
    radius: 200,
  },
  RAIN_OF_PILA: {
    cost: 50,
    cooldown: 15000,
    duration: 3000,
    damage: 40,
    radius: 150,
  },
  HEALING_SPRING: {
    cost: 40,
    cooldown: 18000,
    duration: 4000,
    healAmount: 60,
    radius: 180,
  },
  
  // Alien Spells
  MIND_CONTROL: {
    cost: 60,
    cooldown: 20000,
    duration: 8000,
    range: 300,
  },
  PLASMA_BOMB: {
    cost: 45,
    cooldown: 14000,
    damage: 50,
    radius: 120,
  },
  
  // Viking Spells
  THORS_LIGHTNING: {
    cost: 40,
    cooldown: 14000,
    damage: 55,
    range: 400,
  },
  BATTLE_RAGE: {
    cost: 35,
    cooldown: 12000,
    duration: 5000,
    attackSpeedBonus: 0.4,  // +40% attack speed
    radius: 180,
  },
  FROST_SHIELD: {
    cost: 30,
    cooldown: 16000,
    duration: 3000,
    radius: 150,
  },
  
  // Upgrades
  ROMAN_UPGRADES: {
    armor: {
      name: 'Armor Upgrade',
      cost: 200,
      hpBonus: 0.2,  // +20% HP
    },
    weapon: {
      name: 'Weapon Upgrade',
      cost: 200,
      damageBonus: 0.2,  // +20% attack
    },
  },
  
  ALIEN_UPGRADES: {
    cloningVats: {
      name: 'Cloning Vats',
      cost: 150,
      cooldownReduction: 0.25,  // -25% train times
    },
    plasmaInfusion: {
      name: 'Plasma Infusion',
      cost: 200,
      damageBonus: 0.2,  // +20% attack
    },
    exoskeleton: {
      name: 'Exoskeleton',
      cost: 200,
      hpBonus: 0.2,  // +20% HP
    },
    warpDrive: {
      name: 'Warp Drive',
      cost: 175,
      speedBonus: 0.15,  // +15% speed
    },
  },
  
  VIKING_UPGRADES: {
    ironForging: {
      name: 'Iron Forging',
      cost: 200,
      damageBonus: 0.2,  // +20% attack
    },
    shieldWallTraining: {
      name: 'Shield Wall Training',
      cost: 200,
      hpBonus: 0.2,  // +20% HP
    },
    meadHall: {
      name: 'Mead Hall',
      cost: 175,
      speedBonus: 0.15,  // +15% speed
    },
  },
  
  // Mining
  MINE_OFFSET_FROM_BASE: 300,  // Distance from base to gold mine
  MINING_TIME: 3000,           // Time to collect gold (ms)
  GOLD_PER_TRIP: 30,           // Gold collected per mining trip
  WORKER_FLEE_DISTANCE: 200,   // How close enemies must be to trigger flee
  
  // AI settings
  AI_SPAWN_INTERVAL: 4000,  // ms between AI spawn attempts
  AI_SPAWN_CHANCE: 0.7,     // 70% chance to spawn when able
  AI_WORKER_PRIORITY: 0.4,  // 40% chance to spawn worker if affordable
  AI_MIN_WORKERS: 2,        // AI maintains at least this many workers
  AI_PROBE_BEAM_INTERVAL: 6000,  // ms between AI probe beam checks
  AI_PROBE_BEAM_HP_THRESHOLD: 20,  // Sacrifice units below this HP
  AI_SPELL_CHECK_INTERVAL: 5000,  // ms between AI spell casting checks
  AI_MIND_CONTROL_MIN_COST: 100,  // Only mind control units worth this much gold or more
  AI_PLASMA_BOMB_MIN_CLUSTER: 3,  // Minimum units in cluster to cast plasma bomb
  AI_UPGRADE_CHECK_INTERVAL: 8000,  // ms between AI upgrade checks
  AI_UPGRADE_GOLD_THRESHOLD: 400,  // Only buy upgrades when gold above this
  AI_SCOUT_INTERVAL: 15000,  // ms between AI scout spawn attempts
  AI_SCOUT_CHANCE: 0.6,  // 60% chance to spawn scout when able
  AI_SCOUT_MAX: 2,  // Maximum number of active AI scouts at once
  
  // Initial spawns
  INITIAL_PLAYER_LEGIONARIES: 1,
  INITIAL_PLAYER_WORKERS: 1,
  INITIAL_ALIEN_DRONES: 1,
  INITIAL_ALIEN_HARVESTERS: 1,
  
  // Colors
  COLORS: {
    playerHealth: 0x4CAF50,  // Green HP bars
    enemyHealth: 0x9C27B0,   // Purple for aliens
    healthBarBg: 0x222222,
    gold: 0xFFD700,
    mana: 0x00FFFF,  // Cyan crystal
    buttonBg: 0x8B4513,  // Roman brown/bronze
    buttonBgHover: 0xA0522D,
    buttonBgDisabled: 0x555555,
    cooldownOverlay: 0x000000,  // Black overlay for cooldown
    probeBeam: 0x00FF00,  // Green tractor beam
    shieldGold: 0xFFD700,  // Golden shield
    healingBlue: 0x00CED1,  // Blue-green healing
    spellButton: 0x8B0000,  // Dark red for spell buttons
    mindControl: 0x00FF00,  // Green mind control
    plasmaBomb: 0x39FF14,  // Bright green plasma
  },
  
  // Safe area margins (percentage)
  SAFE_AREA: {
    top: 0.05,
    bottom: 0.04,
    left: 0.03,
    right: 0.03,
  }
};
