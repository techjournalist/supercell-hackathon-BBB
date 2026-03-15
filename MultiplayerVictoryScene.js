import Phaser from 'phaser';

export class MultiplayerVictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerVictoryScene' });
  }

  preload() {
    this.load.image('menu-bg', 'https://rosebud.ai/assets/menu-screen.jpeg?D4E2');
  }

  create() {
    const { width, height } = this.scale;

    const onlineResult = this.registry.get('onlineResult');
    const isOnline = !!onlineResult;

    const bg = this.add.image(width / 2, 0, 'menu-bg');
    bg.setOrigin(0.5, 0);
    const scale = Math.max(width / bg.width, height / bg.height);
    bg.setScale(scale);
    this.add.rectangle(0, 0, width, height, 0x000000, 0.62).setOrigin(0);

    if (isOnline) {
      this._drawOnlineResult(onlineResult, width, height);
    } else {
      this._drawLocalResult(width, height);
    }
  }

  _drawLocalResult(width, height) {
    const winnerNum = this.registry.get('multiplayerWinner');
    const stats = this.registry.get('multiplayerStats') || {};
    const winnerColor = winnerNum === 1 ? '#4488FF' : '#FF4488';

    const winnerText = this.add.text(width / 2, height * 0.22, `PLAYER ${winnerNum} WINS!`, {
      fontSize: '58px', fontFamily: 'Press Start 2P', color: winnerColor,
      stroke: '#000000', strokeThickness: 8,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: winnerText, scale: 1.08,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(width / 2, height * 0.38, '🏆', { fontSize: '72px' }).setOrigin(0.5);

    const gt = stats.gameTime || 0;
    this.add.text(width / 2, height * 0.52,
      `Time: ${Math.floor(gt / 60)}:${(gt % 60).toString().padStart(2, '0')}\n\n` +
      `Player 1:  ${stats.p1Units || 0} units  •  ${stats.p1Gold || 0} gold\n` +
      `Player 2:  ${stats.p2Units || 0} units  •  ${stats.p2Gold || 0} gold`,
      {
        fontSize: '16px', fontFamily: 'Arial', color: '#CCCCCC',
        align: 'center', lineSpacing: 10,
      }).setOrigin(0.5);

    this._createButton(width / 2 - 160, height * 0.82, 'REMATCH', () => {
      this.scene.start('MultiplayerSetupScene');
    });
    this._createButton(width / 2 + 160, height * 0.82, 'MAIN MENU', () => {
      this.scene.start('MenuScene');
    });
  }

  _drawOnlineResult(result, width, height) {
    const { won, forfeit, gameTime, myFaction, oppFaction, myDisplayName, oppDisplayName } = result;

    const titleColor = won ? '#44ff88' : '#ff4444';
    const titleText = won
      ? (forfeit ? 'OPPONENT LEFT\nYOU WIN!' : 'VICTORY!')
      : (forfeit ? 'CONNECTION LOST' : 'DEFEAT');

    const title = this.add.text(width / 2, height * 0.18, titleText, {
      fontSize: '52px', fontFamily: 'Press Start 2P', color: titleColor,
      stroke: '#000', strokeThickness: 8, align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title, scale: 1.06,
      duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    this.add.text(width / 2, height * 0.36, won ? '🏆' : '💀', { fontSize: '64px' }).setOrigin(0.5);

    const panelW = Math.min(600, width * 0.8);
    const panelX = width / 2 - panelW / 2;
    const panelY = height * 0.46;

    const panel = this.add.graphics();
    panel.fillStyle(0x0a0818, 0.85);
    panel.fillRoundedRect(panelX, panelY, panelW, 160, 14);
    panel.lineStyle(1.5, won ? 0x44ff88 : 0xff4444, 0.5);
    panel.strokeRoundedRect(panelX, panelY, panelW, 160, 14);

    const factionIcons = { roman: '🛡️', viking: '⚔️', alien: '👽' };
    const gt = gameTime || 0;

    this.add.text(width / 2 - panelW / 4, panelY + 32,
      `${factionIcons[myFaction] || '?'} YOU`, {
        fontSize: '16px', fontFamily: 'Press Start 2P',
        color: won ? '#44ff88' : '#ff4444',
      }).setOrigin(0.5);

    this.add.text(width / 2 - panelW / 4, panelY + 66,
      myDisplayName || 'You', {
        fontSize: '12px', fontFamily: 'Arial', color: '#cccccc',
      }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 80, 'VS', {
      fontSize: '20px', fontFamily: 'Press Start 2P', color: '#555566',
    }).setOrigin(0.5);

    this.add.text(width / 2 + panelW / 4, panelY + 32,
      `${factionIcons[oppFaction] || '?'} OPP`, {
        fontSize: '16px', fontFamily: 'Press Start 2P',
        color: won ? '#ff4444' : '#44ff88',
      }).setOrigin(0.5);

    this.add.text(width / 2 + panelW / 4, panelY + 66,
      oppDisplayName || 'Opponent', {
        fontSize: '12px', fontFamily: 'Arial', color: '#cccccc',
      }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 130,
      `Game time: ${Math.floor(gt / 60)}m ${gt % 60}s`, {
        fontSize: '12px', fontFamily: 'Arial', color: '#888888',
      }).setOrigin(0.5);

    this._createButton(width / 2 - 170, height * 0.84, 'PLAY AGAIN', () => {
      this.registry.remove('onlineResult');
      this.scene.start('MultiplayerSetupScene');
    });
    this._createButton(width / 2 + 60, height * 0.84, 'MAIN MENU', () => {
      this.registry.remove('onlineResult');
      this.scene.start('MenuScene');
    });
  }

  _createButton(x, y, text, callback) {
    const btn = this.add.graphics();
    const w = 220, h = 52;
    const drawBtn = (hover) => {
      btn.clear();
      btn.fillStyle(hover ? 0xA0522D : 0x8B4513, 0.95);
      btn.fillRoundedRect(x - w / 2, y - h / 2, w, h, 8);
      btn.lineStyle(2, 0xFFD700, hover ? 1 : 0.7);
      btn.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 8);
    };
    drawBtn(false);

    const txt = this.add.text(x, y, text, {
      fontSize: '16px', fontFamily: 'Press Start 2P', color: '#FFFFFF',
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x, y, w, h, 0, 0).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => drawBtn(true));
    hit.on('pointerout', () => drawBtn(false));
    hit.on('pointerdown', callback);
  }
}
