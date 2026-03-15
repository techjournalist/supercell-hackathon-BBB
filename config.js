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
      health: 90,
      damage: 13,
      attackRange: 100,
      attackSpeed: 1000,
      speed: 70,
      cost: 70,
      cooldown: 3500,
    },
    pilum: {
      name: 'Pilum Thrower',
      health: 65,         // was 45 - increased survivability
      damage: 16,         // was 18 - slightly reduced, balanced by range
      attackRange: 280,
      attackSpeed: 1500,
      speed: 80,
      cost: 100,
      cooldown: 5000,
      rangedDamageFalloff: 0.7,  // 30% damage reduction at max range
    },
    centurion: {
      name: 'Centurion',
      health: 220,
      damage: 27,
      attackRange: 110,
      attackSpeed: 1100,
      speed: 52,
      cost: 200,
      cooldown: 7000,
      auraRadius: 250,    // raised from 150: wide enough to cover a real formation
      auraBonus: 0.2,     // raised from 0.1: +20% damage is meaningful at 200g cost
    },
    scout: {
      name: 'Scout',
      health: 55,
      damage: 6,
      attackRange: 80,
      attackSpeed: 900,
      speed: 125,
      cost: 60,
      cooldown: 3000,
      visionMultiplier: 1.6,
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
      damage: 4,
      attackRange: 70,
      attackSpeed: 900,
      speed: 130,
      cost: 55,
      cooldown: 3000,
      visionMultiplier: 1.7,
    },
    drone: {
      name: 'Drone',
      health: 50,         // was 40 - buffed so legionary matchup is even
      damage: 9,          // was 8 - slight increase
      attackRange: 90,
      attackSpeed: 850,
      speed: 90,          // was 95 - slight slowdown
      cost: 55,           // was 40 - cost adjusted to be fair vs Legionary
      cooldown: 3000,     // was 2500 - slowed to match cost
    },
    blaster: {
      name: 'Blaster',
      health: 60,         // was 50 - more resilient
      damage: 18,         // was 20 - slight reduction
      attackRange: 300,
      attackSpeed: 1800,
      speed: 72,
      cost: 100,
      cooldown: 5000,
      rangedDamageFalloff: 0.7,  // 30% damage reduction at max range
    },
    overlord: {
      name: 'Overlord',
      health: 200,
      damage: 30,
      attackRange: 120,
      attackSpeed: 1200,
      speed: 48,
      cost: 225,
      cooldown: 8500,
      auraRadius: 240,    // raised from 130 to match centurion
      auraBonus: 0.18,    // raised from 0.08: meaningful for 225g unit
    }
  },

  // Viking units (third playable faction)
  VIKING_UNITS: {
    thrall: {
      name: 'Thrall',
      health: 28,
      damage: 0,
      attackRange: 0,
      attackSpeed: 0,
      speed: 70,
      cost: 45,
      cooldown: 2500,
    },
    berserker: {
      name: 'Berserker',
      health: 75,
      damage: 15,
      attackRange: 100,
      attackSpeed: 850,   // was 900 - slightly faster attack
      speed: 105,
      cost: 65,
      cooldown: 3500,
      berserkerThreshold: 0.5,  // below 50% HP: +25% damage bonus
      berserkerBonus: 0.25,
    },
    axeThrower: {
      name: 'Axe Thrower',
      health: 52,         // was 40 - more robust
      damage: 15,         // was 16 - balanced
      attackRange: 280,
      attackSpeed: 1600,
      speed: 78,
      cost: 95,
      cooldown: 5000,
      rangedDamageFalloff: 0.72,
    },
    jarl: {
      name: 'Jarl',
      health: 210,
      damage: 30,
      attackRange: 115,
      attackSpeed: 1300,
      speed: 52,
      cost: 210,
      cooldown: 7500,
      auraRadius: 250,    // raised from 150 to match centurion
      auraBonus: 0.2,     // raised from 0.12: consistent with other commander units
    }
  },

  // Resources
  STARTING_GOLD: 150,     // raised from 120: faster opening, first worker + unit sooner
  STARTING_MANA: 40,      // raised from 20: can cast 1 spell immediately on first engagement
  MAX_MANA: 200,
  PASSIVE_MANA_REGEN: 1.2, // raised from 0.5: meaningful passive trickle (~17s/spell at no structures)

  // Mana structures
  AQUEDUCT_COST: 100,
  AQUEDUCT_MANA_RATE: 4,    // raised from 2.5: 1 aqueduct gives comfortable spell rhythm
  AQUEDUCT_UPGRADE_COST: 150,
  AQUEDUCT_UPGRADED_RATE: 7, // raised from 5: upgrade is a real power spike

  // Probe Beam (Alien mana ability)
  PROBE_BEAM_COOLDOWN: 4000,  // was 5000 - more responsive

  // Viking mana system (Odin's Blessing)
  ODINS_BLESSING_COST: 100,
  ODINS_BLESSING_MANA_RATE: 4,       // raised from 3 to match aqueduct
  ODINS_BLESSING_UPGRADE_COST: 150,
  ODINS_BLESSING_UPGRADED_RATE: 7,   // raised from 5.5 to match aqueduct upgrade

  // Roman Spells
  SHIELD_WALL: {
    cost: 30,
    cooldown: 12000,
    duration: 6000,       // was 5000 - longer shield
    damageReduction: 0.5,
    radius: 200,
  },
  RAIN_OF_PILA: {
    cost: 50,
    cooldown: 14000,      // was 15000 - slightly faster
    duration: 3000,
    damage: 45,           // was 40 - slightly more punch
    radius: 160,          // was 150 - wider
  },
  HEALING_SPRING: {
    cost: 40,
    cooldown: 16000,      // was 18000 - slightly faster
    duration: 5000,       // was 4000 - longer healing
    healAmount: 75,       // was 60 - more impactful
    radius: 180,
  },

  // Alien Spells
  MIND_CONTROL: {
    cost: 60,
    cooldown: 20000,
    duration: 10000,      // was 8000 - longer control window
    range: 350,           // was 300 - slightly longer range
  },
  PLASMA_BOMB: {
    cost: 45,
    cooldown: 13000,      // was 14000 - slightly faster
    damage: 55,           // was 50 - more impactful
    radius: 130,          // was 120 - wider
  },

  // Viking Spells
  THORS_LIGHTNING: {
    cost: 40,
    cooldown: 13000,      // was 14000
    damage: 60,           // was 55 - more impactful
    range: 400,
    chainCount: 3,        // NEW: chain up to 3 targets
    chainRange: 250,      // NEW: chain lightning jumps within this range
    chainDamageMult: 0.6, // NEW: each chain does 60% of previous
  },
  BATTLE_RAGE: {
    cost: 35,
    cooldown: 11000,      // was 12000 - slightly faster
    duration: 6000,       // was 5000 - longer rage
    attackSpeedBonus: 0.45,  // was 0.4 - slightly stronger
    radius: 190,          // was 180 - wider
  },
  FROST_SHIELD: {
    cost: 30,
    cooldown: 15000,
    duration: 4000,
    radius: 160,
    damageReduction: 0.35,  // 35% damage reduction on protected units
    slowAmount: 0.4,        // 40% speed/attack slow on attackers who hit shielded units
  },

  // Upgrades
  ROMAN_UPGRADES: {
    armor: {
      name: 'Armor Upgrade',
      cost: 200,
      hpBonus: 0.25,      // was 0.2 - slightly stronger
    },
    weapon: {
      name: 'Weapon Upgrade',
      cost: 200,
      damageBonus: 0.25,  // was 0.2 - slightly stronger
    },
  },

  ALIEN_UPGRADES: {
    cloningVats: {
      name: 'Cloning Vats',
      cost: 200,          // was 150 - raised to balance power level
      cooldownReduction: 0.15,  // was 0.25 - reduced to 15% (still strong but not broken)
    },
    plasmaInfusion: {
      name: 'Plasma Infusion',
      cost: 200,
      damageBonus: 0.2,
    },
    exoskeleton: {
      name: 'Exoskeleton',
      cost: 200,
      hpBonus: 0.25,      // was 0.2 - slightly stronger
    },
    warpDrive: {
      name: 'Warp Drive',
      cost: 175,
      speedBonus: 0.18,   // was 0.15 - slightly stronger
    },
  },

  VIKING_UPGRADES: {
    ironForging: {
      name: 'Iron Forging',
      cost: 200,
      damageBonus: 0.25,  // was 0.2
    },
    shieldWallTraining: {
      name: 'Shield Wall Training',
      cost: 200,
      hpBonus: 0.25,      // was 0.2
    },
    meadHall: {
      name: 'Mead Hall',
      cost: 175,
      speedBonus: 0.18,   // was 0.15
    },
  },

  // Mining
  MINE_OFFSET_FROM_BASE: 300,
  MINING_TIME: 2500,   // reduced from 3000: slightly snappier mining feel
  GOLD_PER_TRIP: 35,   // raised from 30: less grind, more decisions
  WORKER_FLEE_DISTANCE: 220,    // was 200 - flee a bit earlier

  // Rally Point
  RALLY_POINT_ENABLED: true,

  // Defense Structures
  DEFENSE_TOWER: {
    cost: 150,
    health: 300,
    damage: 12,
    attackRange: 280,
    attackSpeed: 1200,
    name: 'Defense Tower',
  },

  // Kill Feed
  KILL_FEED_MAX: 5,
  KILL_FEED_DURATION: 4000,

  // AI settings
  AI_SPAWN_INTERVAL: 3800,      // was 4000 - slightly faster
  AI_SPAWN_CHANCE: 0.72,        // was 0.70 - slightly more aggressive
  AI_WORKER_PRIORITY: 0.35,     // was 0.4 - slightly less worker-focused
  AI_MIN_WORKERS: 2,
  AI_PROBE_BEAM_INTERVAL: 5500,
  AI_PROBE_BEAM_HP_THRESHOLD: 22,
  AI_SPELL_CHECK_INTERVAL: 4500, // was 5000 - more frequent spell checks
  AI_MIND_CONTROL_MIN_COST: 90,  // was 100 - will target cheaper units too
  AI_PLASMA_BOMB_MIN_CLUSTER: 3,
  AI_UPGRADE_CHECK_INTERVAL: 7000, // was 8000 - more frequent upgrade checks
  AI_UPGRADE_GOLD_THRESHOLD: 350,  // was 400 - buy upgrades earlier
  AI_SCOUT_INTERVAL: 12000,     // was 15000 - more frequent scouting
  AI_SCOUT_CHANCE: 0.65,
  AI_SCOUT_MAX: 2,
  AI_THREAT_HP_THRESHOLD: 0.45, // Base HP % below which AI switches to emergency defense

  // Initial spawns
  INITIAL_PLAYER_LEGIONARIES: 1,
  INITIAL_PLAYER_WORKERS: 1,
  INITIAL_ALIEN_DRONES: 1,
  INITIAL_ALIEN_HARVESTERS: 1,

  // Colors
  COLORS: {
    playerHealth: 0x4CAF50,
    enemyHealth: 0xE53935,       // was purple - now red for enemies
    healthBarBg: 0x222222,
    gold: 0xFFD700,
    mana: 0x00BFFF,              // was 00FFFF - deeper blue
    buttonBg: 0x8B4513,
    buttonBgHover: 0xA0522D,
    buttonBgDisabled: 0x555555,
    cooldownOverlay: 0x000000,
    probeBeam: 0x00FF00,
    shieldGold: 0xFFD700,
    healingBlue: 0x00CED1,
    spellButton: 0x8B0000,
    mindControl: 0x00FF00,
    plasmaBomb: 0x39FF14,
    rallyCross: 0x00FF88,        // Rally point marker color
    defenseTower: 0x607D8B,      // Defense tower color
    killFeedPlayer: 0x4CAF50,
    killFeedEnemy: 0xFF5252,
    berserkerRage: 0xFF3300,     // Color for berserk visual
    chainLightning: 0xFFFF44,    // Chain lightning color
    frostSlow: 0x88DDFF,         // Frost slow indicator
  },

  // Safe area margins (percentage)
  SAFE_AREA: {
    top: 0.05,
    bottom: 0.04,
    left: 0.03,
    right: 0.03,
  }
};
