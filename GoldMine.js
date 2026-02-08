import Phaser from 'phaser';

export class GoldMine extends Phaser.GameObjects.Container {
  constructor(scene, x, y, spriteKey = 'gold-mine') {
    super(scene, x, y);
    
    this.scene = scene;
    
    // Health stats for mines - can be destroyed
    this.maxHealth = 500;
    this.health = this.maxHealth;
    this.isDead = false;
    
    // Create mine sprite
    this.mine = scene.add.sprite(0, 0, spriteKey);
    this.mine.setScale(0.2);
    
    // Add glow effect
    this.glow = scene.add.circle(0, 0, 40, 0xFFD700, 0.2);
    
    // Pulsing animation
    this.glowTween = scene.tweens.add({
      targets: this.glow,
      alpha: 0.4,
      scale: 1.1,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    // Health bar background
    this.healthBarBg = scene.add.rectangle(0, -60, 80, 8, 0x333333);
    
    // Health bar
    this.healthBar = scene.add.rectangle(0, -60, 80, 8, 0xFFD700);
    
    this.add([this.glow, this.mine, this.healthBarBg, this.healthBar]);
    
    scene.add.existing(this);
  }
  
  takeDamage(amount, fromX, fromY) {
    if (this.isDead) return;
    
    this.health -= amount;
    
    // Update health bar
    const healthPercent = Math.max(0, this.health / this.maxHealth);
    this.scene.tweens.add({
      targets: this.healthBar,
      width: 80 * healthPercent,
      duration: 200,
      ease: 'Power2'
    });
    
    // Show damage number
    const damageText = this.scene.add.text(this.x, this.y - 80, `-${amount}`, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#FF0000',
      stroke: '#000000',
      strokeThickness: 3,
    });
    damageText.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => damageText.destroy()
    });
    
    // Shake effect
    this.scene.tweens.add({
      targets: this.mine,
      x: this.mine.x + 5,
      duration: 50,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.mine.x = 0;
      }
    });
    
    // Flash red
    this.scene.tweens.add({
      targets: this.mine,
      tint: 0xff0000,
      duration: 150,
      yoyo: true,
      onComplete: () => {
        this.mine.clearTint();
      }
    });
    
    if (this.health <= 0) {
      this.die();
    }
  }
  
  die() {
    this.isDead = true;
    
    // Stop glow animation
    if (this.glowTween) {
      this.glowTween.stop();
    }
    
    // Destruction effect - fade out and crumble
    this.scene.tweens.add({
      targets: [this.mine, this.glow, this.healthBar, this.healthBarBg],
      alpha: 0,
      scale: 0.5,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.destroy();
      }
    });
    
    // Show destruction message
    const destroyText = this.scene.add.text(this.x, this.y - 60, 'MINE DESTROYED!', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFD700',
      stroke: '#000000',
      strokeThickness: 4,
    });
    destroyText.setOrigin(0.5);
    
    this.scene.tweens.add({
      targets: destroyText,
      y: destroyText.y - 50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => destroyText.destroy()
    });
  }
}
