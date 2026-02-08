import Phaser from 'phaser';

export class AlienComicIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'AlienComicIntroScene' });
  }
  
  create() {
    const { width, height } = this.scale;
    const levelNum = this.registry.get('alienLevel') || this.registry.get('campaignLevel') || 1;
    
    // Track campaign start time for level 1
    if (levelNum === 1) {
      const startKey = 'alien_campaign_start';
      if (!localStorage.getItem(startKey)) {
        localStorage.setItem(startKey, Date.now().toString());
        console.log('Started tracking Alien campaign time');
      }
    }
    
    // Background
    const bg = this.add.rectangle(0, 0, width, height, 0x0a0020);
    bg.setOrigin(0);
    
    // Starfield effect
    for (let i = 0; i < 50; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 2),
        0xFFFFFF,
        Phaser.Math.FloatBetween(0.3, 0.8)
      );
    }
    
    // Portrait
    const portrait = this.add.image(width / 2, height / 2 - 40, 'zyx9-portrait');
    portrait.setScale(0.25);
    portrait.setAlpha(0);
    
    // Name plate
    const nameBg = this.add.rectangle(width / 2, height / 2 + 160, 300, 50, 0x4A148C, 0.9);
    nameBg.setAlpha(0);
    
    const nameText = this.add.text(width / 2, height / 2 + 160, 'OVERLORD ZYX-9', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#E1BEE7',
    });
    nameText.setOrigin(0.5);
    nameText.setAlpha(0);
    
    // Dialogue box
    const dialogueBg = this.add.rectangle(width / 2, height - 120, width - 100, 150, 0x1a1a1a, 0.95);
    dialogueBg.setAlpha(0);
    
    const dialogue = this.add.text(width / 2, height - 140, '', {
      fontSize: '16px',
      fontFamily: 'Press Start 2P',
      color: '#E1BEE7',
      align: 'center',
      wordWrap: { width: width - 140 }
    });
    dialogue.setOrigin(0.5, 0);
    dialogue.setAlpha(0);
    
    // Get level-specific dialogue
    const dialogues = {
      1: "Greetings, inferior beings. I am Overlord Zyx-9.\nLet's see if you primitives can handle\nthe BASICS of interstellar conquest.\nTrain some harvesters and drones. Try not to fail.",
      2: "Acceptable performance... for a human.\nNow destroy that pathetic Roman fort.\nTheir 'legions' are no match for superior alien tech.\nThis should be... amusing.",
      3: "Time to gather resources, meat-sack.\nCollect 1500 gold while defending your base.\nThe locals are hostile. What a surprise.\nTry not to embarrass me.",
      4: "Let's test your mental capabilities.\nUse Mind Control FIVE times to win.\nFew combat units available - use your brain.\nAssuming you have one.",
      5: "Vikings. How... quaint.\nDestroy their primitive longhouse.\nThey have axes. We have plasma weapons.\nThis won't be fair... for them.",
      6: "Final exam, monkey. Destroy the Roman fortress.\nThey have 2000 HP and their best troops.\nAll upgrades, all spells, maximum effort.\nDon't disappoint me... again."
    };
    
    const levelDialogue = dialogues[levelNum] || dialogues[1];
    
    // Animate in
    this.tweens.add({
      targets: [portrait, nameBg, nameText],
      alpha: 1,
      duration: 800,
      ease: 'Power2',
    });
    
    this.time.delayedCall(800, () => {
      this.tweens.add({
        targets: [dialogueBg, dialogue],
        alpha: 1,
        duration: 500,
      });
      
      this.time.delayedCall(500, () => {
        this.typeText(dialogue, levelDialogue);
      });
    });
    
    // Continue prompt (appears after dialogue)
    const continueText = this.add.text(width / 2, height - 30, 'Click to continue', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P',
      color: '#9C27B0',
    });
    continueText.setOrigin(0.5);
    continueText.setAlpha(0);
    
    // Make scene clickable after dialogue finishes
    this.time.delayedCall(3500, () => {
      continueText.setAlpha(1);
      
      // Blink animation
      this.tweens.add({
        targets: continueText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });
      
      this.input.once('pointerdown', () => {
        this.startGame();
      });
    });
  }
  
  typeText(textObject, fullText) {
    let currentText = '';
    let index = 0;
    
    const timer = this.time.addEvent({
      delay: 30,
      callback: () => {
        if (index < fullText.length) {
          currentText += fullText[index];
          textObject.setText(currentText);
          index++;
        } else {
          timer.remove();
        }
      },
      loop: true,
    });
  }
  
  startGame() {
    // State already set by AlienCampaignScene
    // Configure player faction as Alien
    this.registry.set('playerFaction', 'alien');
    
    this.scene.start('GameScene');
  }
}
