import { CONFIG } from './config.js';

// Modular Faction System - Each faction is self-contained
export const FACTIONS = {
  roman: {
    id: 'roman',
    name: 'Romans',
    color: 0xDC143C,
    icon: '🛡️',
    
    units: {
      worker: {
        name: 'Worker',
        cost: 50,
        health: 30,
        damage: 3,
        range: 30,
        speed: 80,
        cooldown: 2000,
        sprite: 'worker',
        canMine: true,
      },
      legionary: {
        name: 'Legionary',
        cost: 70,
        health: 90,
        damage: 13,
        range: 100,
        speed: 70,
        cooldown: 3500,
        sprite: 'legionary',
      },
      pilum: {
        name: 'Pilum Thrower',
        cost: 100,
        health: 65,
        damage: 16,
        range: 280,
        speed: 80,
        cooldown: 5000,
        sprite: 'pilum',
      },
      centurion: {
        name: 'Centurion',
        cost: 200,
        health: 220,
        damage: 27,
        range: 110,
        speed: 52,
        cooldown: 7000,
        sprite: 'centurion',
      },
      scout: {
        name: 'Scout',
        cost: 60,
        health: 55,
        damage: 6,
        range: 80,
        speed: 125,
        cooldown: 3000,
        sprite: 'scout',
        visionBonus: 1.6,
      },
    },
    
    spells: {
      shieldWall: {
        name: 'Shield Wall',
        icon: '🛡️',
        cost: 40,
        cooldown: 12000,
        color: 0xFFD700,
        effect: 'defensive',
      },
      rainOfPila: {
        name: 'Rain of Pila',
        icon: '⚔️',
        cost: 50,
        cooldown: 15000,
        damage: 60,
        radius: 120,
        color: 0xFF6600,
        effect: 'offensive',
      },
      healingSpring: {
        name: 'Healing Spring',
        icon: '💧',
        cost: 35,
        cooldown: 18000,
        healing: 60,
        duration: 4000,
        radius: 150,
        color: 0x00CED1,
        effect: 'support',
      },
    },
    
    upgrades: {
      armor: {
        name: 'Armor Smithing',
        icon: '🛡️',
        cost: 200,
        hpBonus: 0.2,
      },
      weapon: {
        name: 'Weapon Forging',
        icon: '⚔️',
        cost: 200,
        damageBonus: 0.2,
      },
    },
    
    manaSystem: {
      type: 'structure',
      structure: 'aqueduct',
      baseCost: 150,
      baseRate: 2,
      upgradeCost: 200,
      upgradeRate: 4,
    },
    
    theme: {
      base: 'player-castle',
      mine: 'gold-mine',
      terrain: {
        groundColor: 0x7CB342,
        decorations: ['columns', 'olive_trees'],
        atmosphere: 'mediterranean',
      },
      audio: {
        attack: 'sword_clang',
        death: 'grunt',
        spawn: 'march',
      },
    },
    
    campaignLevels: 8,
    commanderPortrait: 'emperor-portrait',
    commanderName: 'Emperor Gluteus Maximus',
  },
  
  alien: {
    id: 'alien',
    name: 'Aliens',
    color: 0x9C27B0,
    icon: '👽',
    
    units: {
      harvester: {
        name: 'Harvester',
        cost: 45,
        health: 35,
        damage: 4,
        range: 30,
        speed: 85,
        cooldown: 2000,
        sprite: 'harvester',
        canMine: true,
      },
      drone: {
        name: 'Drone',
        cost: 55,
        health: 50,
        damage: 9,
        range: 90,
        speed: 90,
        cooldown: 3000,
        sprite: 'drone',
      },
      blaster: {
        name: 'Blaster',
        cost: 100,
        health: 60,
        damage: 18,
        range: 300,
        speed: 72,
        cooldown: 5000,
        sprite: 'blaster',
      },
      overlord: {
        name: 'Overlord',
        cost: 225,
        health: 200,
        damage: 30,
        range: 120,
        speed: 48,
        cooldown: 8500,
        sprite: 'overlord',
      },
      alienScout: {
        name: 'Scout',
        cost: 55,
        health: 45,
        damage: 4,
        range: 70,
        speed: 130,
        cooldown: 3000,
        sprite: 'alien-scout',
        visionBonus: 1.7,
      },
    },
    
    spells: {
      plasmaBomb: {
        name: 'Plasma Bomb',
        icon: '💥',
        cost: 45,
        cooldown: 14000,
        damage: 70,
        radius: 140,
        color: 0x00FF00,
        effect: 'offensive',
      },
      mindControl: {
        name: 'Mind Control',
        icon: '🧠',
        cost: 60,
        cooldown: 20000,
        duration: 8000,
        color: 0xFF00FF,
        effect: 'control',
      },
      teleport: {
        name: 'Teleport',
        icon: '🌀',
        cost: 40,
        cooldown: 16000,
        color: 0x00FFFF,
        effect: 'utility',
      },
    },
    
    upgrades: {
      cloningVats: {
        name: 'Cloning Vats',
        icon: '🧬',
        cost: 150,
        cooldownReduction: 0.15,
      },
      plasmaInfusion: {
        name: 'Plasma Infusion',
        icon: '⚡',
        cost: 200,
        damageBonus: 0.25,
      },
      exoskeleton: {
        name: 'Exoskeleton',
        icon: '🛡️',
        cost: 200,
        hpBonus: 0.2,
      },
      warpDrive: {
        name: 'Warp Drive',
        icon: '🚀',
        cost: 175,
        speedBonus: 0.2,
      },
    },
    
    manaSystem: {
      type: 'sacrifice',
      costPerMana: 15,
      manaPerSacrifice: 25,
    },
    
    theme: {
      base: 'alien-base',
      mine: 'alien-mine',
      terrain: {
        groundColor: 0x6A1B9A,
        decorations: ['crystals', 'satellites'],
        atmosphere: 'alien',
      },
      audio: {
        attack: 'laser_zap',
        death: 'pop',
        spawn: 'warp',
      },
    },
    
    campaignLevels: 6,
    commanderPortrait: 'zyx9-portrait',
    commanderName: 'Overlord Zyx-9',
  },
  
  viking: {
    id: 'viking',
    name: 'Vikings',
    color: 0x1976D2,
    icon: '⚔️',
    
    units: {
      thrall: {
        name: 'Thrall',
        cost: 45,
        health: 25,
        damage: 2,
        range: 30,
        speed: 75,
        cooldown: 2000,
        sprite: 'thrall',
        canMine: true,
      },
      berserker: {
        name: 'Berserker',
        cost: 65,
        health: 70,
        damage: 14,
        range: 30,
        speed: 100,
        cooldown: 3000,
        sprite: 'berserker',
      },
      axeThrower: {
        name: 'Axe Thrower',
        cost: 95,
        health: 40,
        damage: 16,
        range: 280,
        speed: 70,
        cooldown: 4500,
        sprite: 'axeThrower',
      },
      jarl: {
        name: 'Jarl',
        cost: 210,
        health: 190,
        damage: 28,
        range: 30,
        speed: 50,
        cooldown: 10000,
        sprite: 'jarl',
      },
    },
    
    spells: {
      thorLightning: {
        name: "Thor's Lightning",
        icon: '⚡',
        cost: 40,
        cooldown: 14000,
        damage: 55,
        color: 0xFFEB3B,
        effect: 'offensive',
      },
      battleRage: {
        name: 'Battle Rage',
        icon: '😤',
        cost: 35,
        cooldown: 12000,
        attackSpeedBonus: 0.4,
        duration: 5000,
        radius: 180,
        color: 0xFF5722,
        effect: 'buff',
      },
      frostShield: {
        name: 'Frost Shield',
        icon: '❄️',
        cost: 30,
        cooldown: 16000,
        duration: 3000,
        radius: 150,
        color: 0x00BCD4,
        effect: 'defensive',
      },
    },
    
    upgrades: {
      ironForging: {
        name: 'Iron Forging',
        icon: '⚔️',
        cost: 200,
        damageBonus: 0.2,
      },
      shieldWallTraining: {
        name: 'Shield Wall',
        icon: '🛡️',
        cost: 200,
        hpBonus: 0.2,
      },
      meadHall: {
        name: 'Mead Hall',
        icon: '🍺',
        cost: 175,
        speedBonus: 0.15,
      },
    },
    
    manaSystem: {
      type: 'passive',
      upgrades: [
        { cost: 100, rate: 3 },
        { cost: 150, rate: 5 },
      ],
    },
    
    theme: {
      base: 'viking-base',
      mine: 'viking-mine',
      terrain: {
        groundColor: 0xE3F2FD,
        decorations: ['snow_patches', 'pine_trees', 'runestones'],
        atmosphere: 'nordic',
      },
      audio: {
        attack: 'axe_thud',
        death: 'roar',
        spawn: 'horn',
      },
    },
    
    campaignLevels: 6,
    commanderPortrait: 'erik-portrait',
    commanderName: 'Erik the Adequate',
  },
};

// Helper function to get faction config
export function getFactionConfig(factionId) {
  return FACTIONS[factionId] || FACTIONS.roman;
}

// Helper function to get all unit configs for a faction
export function getFactionUnits(factionId) {
  const faction = getFactionConfig(factionId);
  return faction.units;
}

// Helper function to get all spell configs for a faction
export function getFactionSpells(factionId) {
  const faction = getFactionConfig(factionId);
  return faction.spells;
}

// Helper function to get all upgrade configs for a faction
export function getFactionUpgrades(factionId) {
  const faction = getFactionConfig(factionId);
  return faction.upgrades;
}
