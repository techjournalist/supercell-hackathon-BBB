import Phaser from 'phaser';

export class FactionSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FactionSelectScene' });
  }
  
  init(data) {
    this.campaignLevel = data.campaignLevel || null;
  }
  
  preload() {
    // Load menu background
    this.load.image('menu-bg', 'https://rosebud.ai/assets/menu-screen.jpeg?D4E2');
    
    // Load unit preview sprites
    this.load.image('worker', 'https://rosebud.ai/assets/worker-unit.webp?J01Z');
    this.load.image('legionary', 'https://rosebud.ai/assets/legionary-unit.webp?qjIO');
    this.load.image('pilum', 'https://rosebud.ai/assets/pilum-thrower-unit.webp?T3tA');
    this.load.image('centurion', 'https://rosebud.ai/assets/centurion-unit.webp?DAva');
    this.load.image('harvester', 'https://rosebud.ai/assets/harvester-unit.webp?Rn3x');
    this.load.image('drone', 'https://rosebud.ai/assets/drone-unit.webp?15fr');
    this.load.image('blaster', 'https://rosebud.ai/assets/blaster-unit.webp?jDED');
    this.load.image('overlord', 'https://rosebud.ai/assets/overlord-unit.webp?htbf');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // If in campaign mode, auto-select Romans and skip to game
    if (this.campaignLevel) {
      this.registry.set('selectedFaction', 'roman');
      this.registry.set('campaignLevel', this.campaignLevel);
      this.scene.start('GameScene');
      return;
    }
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Background image
    const bg = this.add.image(width / 2, 0, 'menu-bg');
    bg.setOrigin(0.5, 0);
    const scaleX = width / bg.width;
    const scaleY = height / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    
    // Dark overlay for better text readability
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.4);
    overlay.setOrigin(0);
    
    // Title
    const title = this.add.text(width / 2, 80, 'SELECT YOUR FACTION', {
      fontSize: '48px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 6,
    });
    title.setOrigin(0.5);
    
    // Roman Faction Card
    this.createFactionCard(
      width / 2 - 250,
      height / 2,
      'ROMANS',
      '🛡️',
      [
        { name: 'Worker', desc: 'Mines gold', sprite: 'worker' },
        { name: 'Legionary', desc: 'Melee', sprite: 'legionary' },
        { name: 'Pilum', desc: 'Ranged', sprite: 'pilum' },
        { name: 'Centurion', desc: 'Tank', sprite: 'centurion' }
      ],
      '#FFD700',
      'roman'
    );
    
    // Alien Faction Card
    this.createFactionCard(
      width / 2 + 250,
      height / 2,
      'ALIENS',
      '👽',
      [
        { name: 'Harvester', desc: 'Mines gold', sprite: 'harvester' },
        { name: 'Drone', desc: 'Fast melee', sprite: 'drone' },
        { name: 'Blaster', desc: 'Ranged', sprite: 'blaster' },
        { name: 'Overlord', desc: 'Heavy', sprite: 'overlord' }
      ],
      '#00FF00',
      'alien'
    );
    
    // Back button
    const backButton = this.add.rectangle(100, height - 60, 150, 50, 0x8B4513);
    backButton.setInteractive({ useHandCursor: true });
    backButton.setStrokeStyle(3, 0xFFD700);
    
    const backText = this.add.text(100, height - 60, 'BACK', {
      fontSize: '20px',
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
    });
    backText.setOrigin(0.5);
    
    backButton.on('pointerdown', () => {
      this.startTransition('MenuScene');
    });
    
    backButton.on('pointerover', () => {
      backButton.setFillStyle(0xA0522D);
    });
    
    backButton.on('pointerout', () => {
      backButton.setFillStyle(0x8B4513);
    });
  }
  
  createFactionCard(x, y, name, icon, units, color, faction) {
    const cardWidth = 400;
    const cardHeight = 500;
    
    // Card background
    const card = this.add.rectangle(x, y, cardWidth, cardHeight, 0x2C2416);
    card.setInteractive({ useHandCursor: true });
    card.setStrokeStyle(5, Phaser.Display.Color.HexStringToColor(color).color);
    
    // Faction icon
    const factionIcon = this.add.text(x, y - 200, icon, {
      fontSize: '100px',
    });
    factionIcon.setOrigin(0.5);
    
    // Faction name
    const factionName = this.add.text(x, y - 100, name, {
      fontSize: '32px',
      fontFamily: 'Press Start 2P',
      color: color,
      stroke: '#000000',
      strokeThickness: 4,
    });
    factionName.setOrigin(0.5);
    
    // Unit list with sprite previews
    let unitY = y - 30;
    units.forEach(unitData => {
      // Unit sprite preview (small)
      const unitSprite = this.add.sprite(x - 120, unitY, unitData.sprite);
      unitSprite.setScale(0.08);
      
      // Unit name and description
      const unitText = this.add.text(x - 60, unitY, `${unitData.name}\n${unitData.desc}`, {
        fontSize: '12px',
        fontFamily: 'Press Start 2P',
        color: '#FFFFFF',
        align: 'left',
        lineSpacing: 2,
      });
      unitText.setOrigin(0, 0.5);
      
      unitY += 70;
    });
    
    // Hover effect
    card.on('pointerover', () => {
      this.tweens.add({
        targets: card,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        ease: 'Power2'
      });
      card.setStrokeStyle(5, 0xFFFFFF);
    });
    
    card.on('pointerout', () => {
      this.tweens.add({
        targets: card,
        scaleX: 1,
        scaleY: 1,
        duration: 200,
        ease: 'Power2'
      });
      card.setStrokeStyle(5, Phaser.Display.Color.HexStringToColor(color).color);
    });
    
    // Click to select faction
    card.on('pointerdown', () => {
      this.registry.set('selectedFaction', faction);
      if (this.campaignLevel) {
        this.registry.set('campaignLevel', this.campaignLevel);
      } else {
        this.registry.set('campaignLevel', null);
      }
      this.startTransition('GameScene');
    });
  }
  
  startTransition(nextScene) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start(nextScene);
    });
  }
}
