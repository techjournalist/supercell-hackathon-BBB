// Spell System - centralized spell management
import { CONFIG } from './config.js';

export class SpellSystem {
  constructor(scene) {
    this.scene = scene;
    
    // Spell configuration lookup
    this.spellData = {
      shieldWall: {
        cost: CONFIG.SHIELD_WALL.cost,
        cooldown: CONFIG.SHIELD_WALL.cooldown,
        name: 'Shield Wall',
        desc: 'Grants nearby allies a golden shield.\n50% damage reduction for 5 seconds.',
        range: `${CONFIG.SHIELD_WALL.radius}px radius`,
      },
      rainOfPila: {
        cost: CONFIG.RAIN_OF_PILA.cost,
        cooldown: CONFIG.RAIN_OF_PILA.cooldown,
        name: 'Rain of Pila',
        desc: 'Rains 12 javelins on target area.\nDeals 40 damage over 3 seconds.',
        range: `${CONFIG.RAIN_OF_PILA.radius}px radius`,
      },
      healingSpring: {
        cost: CONFIG.HEALING_SPRING.cost,
        cooldown: CONFIG.HEALING_SPRING.cooldown,
        name: 'Healing Spring',
        desc: 'Creates a healing fountain.\nRestores 60 HP to allies over 4s.',
        range: `${CONFIG.HEALING_SPRING.radius}px radius`,
      },
      plasmaBomb: {
        cost: CONFIG.PLASMA_BOMB.cost,
        cooldown: CONFIG.PLASMA_BOMB.cooldown,
        name: 'Plasma Bomb',
        desc: 'Devastating plasma explosion.\nDeals 50 damage in area.',
        range: `${CONFIG.PLASMA_BOMB.radius}px radius`,
      },
      mindControl: {
        cost: CONFIG.MIND_CONTROL.cost,
        cooldown: CONFIG.MIND_CONTROL.cooldown,
        name: 'Mind Control',
        desc: 'Takes control of enemy unit.\nLasts 8 seconds.',
        range: `${CONFIG.MIND_CONTROL.range}px range`,
      },
      thorLightning: {
        cost: CONFIG.THORS_LIGHTNING.cost,
        cooldown: CONFIG.THORS_LIGHTNING.cooldown,
        name: "Thor's Lightning",
        desc: "Thor's divine lightning strike.\nDeals 55 damage to target.",
        range: `${CONFIG.THORS_LIGHTNING.range}px range`,
      },
      battleRage: {
        cost: CONFIG.BATTLE_RAGE.cost,
        cooldown: CONFIG.BATTLE_RAGE.cooldown,
        name: 'Battle Rage',
        desc: 'Berserker fury for nearby units.\n+40% attack speed for 5s.',
        range: `${CONFIG.BATTLE_RAGE.radius}px radius`,
      },
      frostShield: {
        cost: CONFIG.FROST_SHIELD.cost,
        cooldown: CONFIG.FROST_SHIELD.cooldown,
        name: 'Frost Shield',
        desc: 'Protective ice shield.\nBlocks damage and slows enemies.',
        range: `${CONFIG.FROST_SHIELD.radius}px radius`,
      },
    };
  }
  
  getCost(spellKey) {
    return this.spellData[spellKey]?.cost || 0;
  }
  
  getCooldown(spellKey) {
    return this.spellData[spellKey]?.cooldown || 0;
  }
  
  getTooltipText(spellKey) {
    const spell = this.spellData[spellKey];
    if (!spell) return '';
    
    let text = `${spell.name}\n`;
    text += `${spell.desc}\n\n`;
    text += `Cost: ${spell.cost} mana\n`;
    text += `Cooldown: ${spell.cooldown / 1000}s\n`;
    text += `Range: ${spell.range}`;
    
    return text;
  }
  
  isAvailable(spellKey, currentMana, cooldowns) {
    const cost = this.getCost(spellKey);
    const cooldown = cooldowns[spellKey] || 0;
    return currentMana >= cost && cooldown <= 0;
  }
}
