// AI Controller - handles enemy AI logic
import { CONFIG } from './config.js';

export class AIController {
  constructor(scene) {
    this.scene = scene;
    this.lastAISpawn = 0;
    this.lastAIProbeBeam = 0;
    this.lastAISpellCheck = 0;
    this.lastAIUpgradeCheck = 0;
    this.lastAIScoutSpawn = 0;
    this.aiScoutTargets = [];
    this.lastScoutWarningTime = 0;
    
    // AI state
    this.aiPhase = 'initial_miners';
    this.aiMinerCount = 0;
    this.aiManaSourceBuilt = false;
  }
  
  update(time, delta) {
    if (this.scene.disableAI || this.scene.isGameOver) return;
    
    // AI spawning
    this.updateSpawning(time, delta);
    
    // AI spells (if alien faction)
    this.updateSpells(time, delta);
    
    // AI upgrades
    this.updateUpgrades(time, delta);
    
    // AI scouts
    this.updateScouts(time, delta);
  }
  
  updateSpawning(time, delta) {
    let aiInterval = CONFIG.AI_SPAWN_INTERVAL;
    let aiChance = CONFIG.AI_SPAWN_CHANCE;
    
    // Apply difficulty modifiers
    if (this.scene.aiSpawnMultiplier) {
      aiInterval = CONFIG.AI_SPAWN_INTERVAL * this.scene.aiSpawnMultiplier;
    }
    
    if (this.scene.aiDifficulty === 'easy') {
      aiInterval = CONFIG.AI_SPAWN_INTERVAL * 2;
      aiChance = CONFIG.AI_SPAWN_CHANCE * 0.5;
    } else if (this.scene.aiDifficulty === 'hard') {
      aiInterval = CONFIG.AI_SPAWN_INTERVAL * 0.7;
      aiChance = CONFIG.AI_SPAWN_CHANCE * 1.3;
    } else if (this.scene.aiDifficulty === 'boss') {
      aiInterval = CONFIG.AI_SPAWN_INTERVAL * 0.5;
      aiChance = CONFIG.AI_SPAWN_CHANCE * 1.5;
    }
    
    if (time - this.lastAISpawn >= aiInterval) {
      this.lastAISpawn = time;
      
      if (Math.random() < aiChance) {
        this.spawnAIUnit();
      }
    }
  }
  
  spawnAIUnit() {
    // AI spawn logic delegated from GameScene
    const factionId = this.scene.enemyFactionId || 'alien';
    let unitConfig = factionId === 'alien' ? CONFIG.ALIEN_UNITS : CONFIG.VIKING_UNITS;
    
    // Simple AI: prioritize workers early, then balance units
    const workerKey = factionId === 'alien' ? 'harvester' : 'thrall';
    const workerCount = this.scene.enemyUnits.filter(u => 
      u.config.name === unitConfig[workerKey].name
    ).length;
    
    if (workerCount < CONFIG.AI_MIN_WORKERS && this.scene.enemyGold >= unitConfig[workerKey].cost) {
      this.scene.spawnEnemyUnit(workerKey, unitConfig[workerKey], factionId);
    } else {
      // Randomly spawn combat units
      const combatUnits = Object.keys(unitConfig).filter(k => k !== workerKey && k !== 'scout');
      if (combatUnits.length > 0) {
        const randomUnit = combatUnits[Math.floor(Math.random() * combatUnits.length)];
        const config = unitConfig[randomUnit];
        
        if (this.scene.enemyGold >= config.cost) {
          this.scene.spawnEnemyUnit(randomUnit, config, factionId);
        }
      }
    }
  }
  
  updateSpells(time, delta) {
    // AI spell casting logic
    if (time - this.lastAISpellCheck < CONFIG.AI_SPELL_CHECK_INTERVAL) return;
    this.lastAISpellCheck = time;
    
    // Implement AI spell logic here if needed
  }
  
  updateUpgrades(time, delta) {
    // AI upgrade purchase logic
    if (time - this.lastAIUpgradeCheck < CONFIG.AI_UPGRADE_CHECK_INTERVAL) return;
    this.lastAIUpgradeCheck = time;
    
    if (this.scene.enemyGold < CONFIG.AI_UPGRADE_GOLD_THRESHOLD) return;
    
    // Purchase available upgrades
    const upgrades = this.scene.alienUpgrades || {};
    for (let key in upgrades) {
      if (!upgrades[key] && this.scene.enemyGold >= 200) {
        // Purchase upgrade logic
        break;
      }
    }
  }
  
  updateScouts(time, delta) {
    // AI scout spawning logic
    if (time - this.lastAIScoutSpawn < CONFIG.AI_SCOUT_INTERVAL) return;
    
    const scoutCount = this.scene.enemyUnits.filter(u => 
      u.config.name === 'Scout'
    ).length;
    
    if (scoutCount < CONFIG.AI_SCOUT_MAX && Math.random() < CONFIG.AI_SCOUT_CHANCE) {
      this.lastAIScoutSpawn = time;
      // Spawn scout logic
    }
  }
}
