// UI Manager - handles UI creation and updates
import { CONFIG } from './config.js';
import { UI_CONSTANTS } from './UIConstants.js';

export class UIManager {
  constructor(scene) {
    this.scene = scene;
    this.elements = {};
    this.baseHealthCache = {
      player: { health: -1, maxHealth: -1 },
      enemy: { health: -1, maxHealth: -1 },
    };
  }
  
  updateBaseHealthBar(baseKey, base, healthBarFill, healthText, healthLabel, healthIcon, shieldIcon) {
    if (!base || base.isDead) return;
    
    const healthPercent = Math.max(0, base.health / base.maxHealth);
    const currentHealth = Math.max(0, Math.floor(base.health));
    const maxHealth = Math.floor(base.maxHealth);
    
    // Only update if health actually changed
    const cache = this.baseHealthCache[baseKey];
    if (cache.health === currentHealth && cache.maxHealth === maxHealth) {
      return;
    }
    
    cache.health = currentHealth;
    cache.maxHealth = maxHealth;
    
    // Update health bar width
    const maxWidth = 136;
    const currentWidth = maxWidth * healthPercent;
    healthBarFill.width = currentWidth;
    
    // Update health text
    healthText.setText(`${currentHealth}/${maxHealth}`);
    
    // Update colors based on health percentage
    if (healthPercent <= 0.25) {
      healthBarFill.setFillStyle(UI_CONSTANTS.COLORS.HEALTH_CRITICAL);
      healthText.setColor('#FF0000');
      healthLabel.setColor('#FF6666');
      
      // Start pulse animation if not already pulsing
      if (!this[`${baseKey}BasePulsing`]) {
        this[`${baseKey}BasePulsing`] = true;
        this.scene.tweens.add({
          targets: [healthIcon, healthLabel],
          alpha: 0.5,
          duration: 400,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else if (healthPercent <= 0.5) {
      healthBarFill.setFillStyle(UI_CONSTANTS.COLORS.HEALTH_WARNING);
      healthText.setColor('#FFAA00');
      healthLabel.setColor('#FFAA66');
      
      // Stop pulsing
      if (this[`${baseKey}BasePulsing`]) {
        this.scene.tweens.killTweensOf([healthIcon, healthLabel]);
        healthIcon.setAlpha(1);
        healthLabel.setAlpha(1);
        this[`${baseKey}BasePulsing`] = false;
      }
    } else {
      healthBarFill.setFillStyle(UI_CONSTANTS.COLORS.HEALTH_NORMAL);
      healthText.setColor('#FFFFFF');
      healthLabel.setColor(baseKey === 'player' ? '#66FF66' : '#FF6666');
      
      // Stop pulsing
      if (this[`${baseKey}BasePulsing`]) {
        this.scene.tweens.killTweensOf([healthIcon, healthLabel]);
        healthIcon.setAlpha(1);
        healthLabel.setAlpha(1);
        this[`${baseKey}BasePulsing`] = false;
      }
    }
    
    // Handle shield icon for player base
    if (baseKey === 'player' && shieldIcon) {
      const enemiesNearBase = this.scene.enemyUnits.filter(u => {
        const dist = Phaser.Math.Distance.Between(u.x, u.y, base.x, base.y);
        return dist < 400 && !u.isDead;
      });
      
      if (enemiesNearBase.length > 0) {
        shieldIcon.setVisible(true);
        if (!this.shieldIconPulsing) {
          this.shieldIconPulsing = true;
          this.scene.tweens.add({
            targets: shieldIcon,
            scale: 1.2,
            alpha: 0.7,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      } else {
        if (this.shieldIconPulsing) {
          this.scene.tweens.killTweensOf(shieldIcon);
          shieldIcon.setScale(1);
          shieldIcon.setAlpha(1);
          this.shieldIconPulsing = false;
        }
        shieldIcon.setVisible(false);
      }
    }
  }
  
  createButton(x, y, size, bgColor, borderColor) {
    const button = this.scene.add.rectangle(x, y, size, size, bgColor);
    button.setInteractive({ useHandCursor: true });
    button.setStrokeStyle(2, borderColor);
    button.setScrollFactor(0);
    button.setDepth(101);
    return button;
  }
  
  createText(x, y, text, style, depth = 102) {
    const textObj = this.scene.add.text(x, y, text, {
      ...style,
      stroke: '#000000',
      strokeThickness: style.strokeThickness || 2,
    });
    textObj.setOrigin(0.5);
    textObj.setScrollFactor(0);
    textObj.setDepth(depth);
    return textObj;
  }
  
  drawRadialCooldown(spellButton, cooldown, maxCooldown) {
    const { x, y, size, cooldownOverlay, cooldownText } = spellButton;
    
    const progress = 1 - (cooldown / maxCooldown);
    
    cooldownOverlay.clear();
    cooldownOverlay.setVisible(true);
    
    const radius = size / 2;
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (2 * Math.PI * (1 - progress));
    
    cooldownOverlay.fillStyle(0x000000, 0.7);
    cooldownOverlay.beginPath();
    cooldownOverlay.moveTo(x, y);
    cooldownOverlay.arc(x, y, radius, startAngle, endAngle, false);
    cooldownOverlay.lineTo(x, y);
    cooldownOverlay.closePath();
    cooldownOverlay.fillPath();
    
    cooldownText.setVisible(true);
    cooldownText.setText(Math.ceil(cooldown).toString());
  }
}
