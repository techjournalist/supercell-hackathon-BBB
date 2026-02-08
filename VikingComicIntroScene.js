import Phaser from 'phaser';

export class VikingComicIntroScene extends Phaser.Scene {
  constructor() {
    super({ key: 'VikingComicIntroScene' });
  }
  
  preload() {
    this.load.image('erik', 'https://rosebud.ai/assets/erik-portrait.webp.webp?e1Ak');
  }
  
  create() {
    const { width, height } = this.scale;
    
    // Get level number from registry
    const levelNum = this.registry.get('campaignLevel');
    
    // Track campaign start time for level 1
    if (levelNum === 1) {
      const startKey = 'viking_campaign_start';
      if (!localStorage.getItem(startKey)) {
        localStorage.setItem(startKey, Date.now().toString());
        console.log('Started tracking Viking campaign time');
      }
    }
    
    // Background
    const bg = this.add.rectangle(0, 0, width, height, 0x1a2332);
    bg.setOrigin(0);
    
    // Erik portrait
    const portrait = this.add.image(width * 0.25, height / 2, 'erik');
    portrait.setScale(0.35);
    
    // Dialogue box
    const dialogueBox = this.add.rectangle(width * 0.65, height / 2, width * 0.5, height * 0.6, 0x2C3E50, 0.95);
    dialogueBox.setStrokeStyle(4, 0x87CEEB);
    
    // Character name
    const nameTag = this.add.text(width * 0.42, height * 0.22, 'ERIK THE ADEQUATE', {
      fontSize: '24px',
      fontFamily: 'Press Start 2P',
      color: '#87CEEB',
    });
    nameTag.setOrigin(0, 0.5);
    
    // Get dialogue for this level
    const dialogue = this.getDialogue(levelNum);
    
    // Dialogue text
    const dialogueText = this.add.text(width * 0.42, height * 0.32, dialogue, {
      fontSize: '18px',
      fontFamily: 'Arial',
      color: '#FFFFFF',
      wordWrap: { width: width * 0.45 },
      lineSpacing: 8,
    });
    
    // Continue instruction
    const continueText = this.add.text(width * 0.65, height * 0.85, 'Click anywhere to continue', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#CCCCCC',
      fontStyle: 'italic',
    });
    continueText.setOrigin(0.5);
    
    // Blink animation
    this.tweens.add({
      targets: continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
    
    // Click to continue
    this.input.once('pointerdown', () => {
      // State already set by VikingCampaignScene, just start game
      this.scene.start('GameScene');
    });
  }
  
  getDialogue(levelNum) {
    const dialogues = {
      1: "Greetings! I'm Erik the Adequate. Not great, not terrible - just adequate.\n\nToday we learn raiding basics. Train some Thralls to mine gold, then recruit Berserkers for fighting.\n\nI've done this... several times. Usually works out okay.",
      
      2: "The Romans built a fort on our fishing spot. Unacceptable!\n\nWe'll need to destroy their base. Nothing fancy - just train units, march them over, fight.\n\nI once defeated a Roman fort using this exact strategy. Well, my cousin did. But I was there!",
      
      3: "Aliens landed in the frozen north. They keep attacking for some reason.\n\nSurvive for 3 minutes and they'll probably leave. That's what usually happens with aliens.\n\nStay near the base, build defenses. I'll be here... providing moral support.",
      
      4: "Thor himself has blessed our warriors! Finally, some divine intervention.\n\nWe're outnumbered, so you'll need to USE SPELLS to win. Click them, cast them, repeat.\n\nI'm... moderately confident this will work. The spells are pretty good, I've heard.",
      
      5: "Bad news: enemies on BOTH sides. Romans left, aliens right.\n\nGood news: we have Vikings on both sides too.\n\nJust... defend both directions equally. It's adequately challenging, but you'll manage. Probably.",
      
      6: "RAGNAROK! The alien mothership has arrived with 2000 HP.\n\nThis is it - the big one. Use everything you've learned. All units, all spells, all upgrades.\n\nIf we win, songs will be sung of your adequacy! If we lose... well, we tried."
    };
    
    return dialogues[levelNum] || "Let's do this. Adequately.";
  }
}
