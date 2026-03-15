import { CONFIG } from './config.js';
import { BaseGameScene } from './BaseGameScene.js';
import { Unit } from './Unit.js';
import { Worker } from './Worker.js';
import { Harvester } from './Harvester.js';
import { Thrall } from './Thrall.js';
import { Base } from './Base.js';
import { GoldMine } from './GoldMine.js';
import { LockstepEngine } from './LockstepEngine.js';
import { MultiplayerNetwork } from './MultiplayerNetwork.js';
import { ProfileManager } from './ProfileManager.js';

export class OnlineGameScene extends BaseGameScene {
  constructor() {
    super({ key: 'OnlineGameScene' });
  }

  preload() {
    this.preloadGameAssets();
  }

  create() {
    const { width, height } = this.scale;

    const room = this.registry.get('onlineRoom');
    this._role = this.registry.get('onlineRole') || 'host';
    this._room = room;

    this._myFaction = this._role === 'host' ? room.host_faction : room.guest_faction;
    this._opponentFaction = this._role === 'host' ? room.guest_faction : room.host_faction;
    this._myDisplayName = this._role === 'host' ? room.host_display_name : room.guest_display_name;
    this._oppDisplayName = this._role === 'host' ? room.guest_display_name : room.host_display_name;

    this._profile = ProfileManager.getActive();
    this._sessionId = this._profile?.sessionId || localStorage.getItem('gameSessionId');

    this.groundY = height * 0.75;

    this.physics.world.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);
    this.cameras.main.setBounds(0, 0, CONFIG.WORLD_WIDTH, height);

    this._isGameOver = false;
    this._isWaiting = false;
    this._pendingCommands = [];

    this._createBackground(width, height);
    this.createUnitAnimations();

    this._myBase = null;
    this._oppBase = null;
    this._myUnits = [];
    this._oppUnits = [];
    this._myGold = CONFIG.STARTING_GOLD;
    this._myMana = CONFIG.STARTING_MANA;
    this._oppGold = CONFIG.STARTING_GOLD;
    this._oppMana = CONFIG.STARTING_MANA;
    this._myCooldowns = {};
    this._oppCooldowns = {};

    const myIsLeft = this._role === 'host';
    this._myBaseX = myIsLeft ? CONFIG.PLAYER_BASE_X : CONFIG.ENEMY_BASE_X;
    this._oppBaseX = myIsLeft ? CONFIG.ENEMY_BASE_X : CONFIG.PLAYER_BASE_X;

    this._createBases();
    this._createGoldMines();
    this._spawnInitialUnits();
    this._createUI(width, height);
    this._setupCamera(width, height);
    this._setupKeys();
    this._setupLockstep();

    MultiplayerNetwork.startHeartbeat(room.room_code);

    this._gameStartTime = this.time.now;
  }

  _createBackground(width, height) {
    const sky = this.add.image(CONFIG.WORLD_WIDTH / 2, height / 2, 'sky');
    sky.setDisplaySize(CONFIG.WORLD_WIDTH, height);
    sky.setScrollFactor(0);
    sky.setDepth(-3);

    const mts = this.add.image(CONFIG.WORLD_WIDTH / 2, height / 2, 'mountains');
    mts.setDisplaySize(CONFIG.WORLD_WIDTH, height);
    mts.setScrollFactor(0.3);
    mts.setDepth(-2);

    const ground = this.add.image(CONFIG.WORLD_WIDTH / 2, this.groundY + 200, 'ground');
    ground.setDisplaySize(CONFIG.WORLD_WIDTH, height * 0.5);
    ground.setScrollFactor(1);
    ground.setDepth(-1);
  }

  _getFactionBaseSprite(faction) {
    if (faction === 'alien') return 'alien-base';
    if (faction === 'viking') return 'viking-base';
    return 'player-castle';
  }

  _createBases() {
    const myIsLeft = this._role === 'host';
    this._myBase = new Base(this, this._myBaseX, this.groundY - 40,
      this._getFactionBaseSprite(this._myFaction), !myIsLeft);
    this._oppBase = new Base(this, this._oppBaseX, this.groundY - 40,
      this._getFactionBaseSprite(this._opponentFaction), myIsLeft);
  }

  _createGoldMines() {
    this._myMines = [];
    this._oppMines = [];
    const myIsLeft = this._role === 'host';

    const myMineSprite = this._myFaction === 'alien' ? 'alien-mine'
      : this._myFaction === 'viking' ? 'viking-mine' : 'gold-mine';
    const oppMineSprite = this._opponentFaction === 'alien' ? 'alien-mine'
      : this._opponentFaction === 'viking' ? 'viking-mine' : 'gold-mine';

    for (let i = 0; i < 2; i++) {
      const mx = myIsLeft
        ? CONFIG.PLAYER_BASE_X + CONFIG.MINE_OFFSET_FROM_BASE + i * 150
        : CONFIG.ENEMY_BASE_X - CONFIG.MINE_OFFSET_FROM_BASE - i * 150;
      this._myMines.push(new GoldMine(this, mx, this.groundY - 20, myMineSprite));
    }

    for (let i = 0; i < 2; i++) {
      const mx = myIsLeft
        ? CONFIG.ENEMY_BASE_X - CONFIG.MINE_OFFSET_FROM_BASE - i * 150
        : CONFIG.PLAYER_BASE_X + CONFIG.MINE_OFFSET_FROM_BASE + i * 150;
      this._oppMines.push(new GoldMine(this, mx, this.groundY - 20, oppMineSprite));
    }
  }

  _getUnitConfig(faction) {
    if (faction === 'alien') return CONFIG.ALIEN_UNITS;
    if (faction === 'viking') return CONFIG.VIKING_UNITS;
    return CONFIG.UNITS;
  }

  _spawnUnit(faction, unitKey, baseX, isEnemy) {
    const cfg = this._getUnitConfig(faction);
    const unitConfig = cfg[unitKey];
    if (!unitConfig) return null;

    const spawnX = isEnemy ? baseX + 100 : baseX - 100;
    let unit;
    if (unitConfig.name === 'Worker') {
      unit = new Worker(this, spawnX, this.groundY - 40, unitConfig, isEnemy);
    } else if (unitConfig.name === 'Harvester') {
      unit = new Harvester(this, spawnX, this.groundY - 40, unitConfig, isEnemy);
    } else if (unitConfig.name === 'Thrall') {
      unit = new Thrall(this, spawnX, this.groundY - 40, unitConfig, isEnemy);
    } else {
      unit = new Unit(this, spawnX, this.groundY - 40, unitConfig, isEnemy);
    }

    unit.setScale(0);
    this.tweens.add({ targets: unit, scale: 1, duration: 200, ease: 'Back.easeOut' });
    return unit;
  }

  _spawnInitialUnits() {
    const myIsLeft = this._role === 'host';
    const myWorkerKey = this._myFaction === 'alien' ? 'harvester'
      : this._myFaction === 'viking' ? 'thrall' : 'worker';
    const oppWorkerKey = this._opponentFaction === 'alien' ? 'harvester'
      : this._opponentFaction === 'viking' ? 'thrall' : 'worker';

    const myUnit = this._spawnUnit(this._myFaction, myWorkerKey, this._myBaseX, !myIsLeft);
    if (myUnit) this._myUnits.push(myUnit);

    const oppUnit = this._spawnUnit(this._opponentFaction, oppWorkerKey, this._oppBaseX, myIsLeft);
    if (oppUnit) this._oppUnits.push(oppUnit);
  }

  _createUI(width, height) {
    const uiBg = this.add.rectangle(0, 0, width, 64, 0x0a0a0a, 0.92).setOrigin(0).setScrollFactor(0).setDepth(100);

    this.add.text(16, 10, this._myDisplayName || 'YOU', {
      fontSize: '12px', fontFamily: 'Press Start 2P', color: '#44ff88',
    }).setScrollFactor(0).setDepth(101);

    const goldIcon = this.add.text(16, 34, '💰', { fontSize: '14px' }).setScrollFactor(0).setDepth(101);
    this._goldText = this.add.text(38, 37, '100', {
      fontSize: '12px', fontFamily: 'Press Start 2P', color: '#FFD700',
    }).setScrollFactor(0).setDepth(101);

    const manaIcon = this.add.text(110, 34, '💎', { fontSize: '14px' }).setScrollFactor(0).setDepth(101);
    this._manaText = this.add.text(132, 37, '50', {
      fontSize: '12px', fontFamily: 'Press Start 2P', color: '#00FFFF',
    }).setScrollFactor(0).setDepth(101);

    this._turnText = this.add.text(width / 2, 32, '', {
      fontSize: '10px', fontFamily: 'Arial', color: '#556677',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    this.add.text(width - 16, 10, this._oppDisplayName || 'OPPONENT', {
      fontSize: '12px', fontFamily: 'Press Start 2P', color: '#ff8844',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

    this._createUnitButtons(width, height);

    this._waitOverlay = this.add.rectangle(0, 0, width, height, 0x000000, 0).setOrigin(0).setScrollFactor(0).setDepth(200);
    this._waitText = this.add.text(width / 2, height / 2, '', {
      fontSize: '18px', fontFamily: 'Press Start 2P', color: '#ffffff',
      stroke: '#000', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(201);
  }

  _createUnitButtons(width, height) {
    const cfg = this._getUnitConfig(this._myFaction);
    const units = Object.entries(cfg);
    const btnSize = 48;
    const gap = 8;
    const startX = width / 2 - (units.length * (btnSize + gap)) / 2;
    const btnY = 80;

    this._unitButtons = [];
    units.slice(0, 5).forEach(([key, config], i) => {
      const x = startX + i * (btnSize + gap) + btnSize / 2;

      const bg = this.add.graphics().setScrollFactor(0).setDepth(102);
      bg.fillStyle(0x1a1a2a, 0.9);
      bg.fillRoundedRect(x - btnSize / 2, btnY - btnSize / 2, btnSize, btnSize, 6);
      bg.lineStyle(1.5, 0x335577, 0.8);
      bg.strokeRoundedRect(x - btnSize / 2, btnY - btnSize / 2, btnSize, btnSize, 6);

      const costT = this.add.text(x, btnY + 14, `${config.cost}g`, {
        fontSize: '8px', fontFamily: 'Arial', color: '#FFD700',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(103);

      const keyNum = i + 1;
      this.add.text(x - btnSize / 2 + 3, btnY - btnSize / 2 + 2, `${keyNum}`, {
        fontSize: '7px', fontFamily: 'Arial', color: '#888888',
      }).setScrollFactor(0).setDepth(103);

      const hit = this.add.rectangle(x, btnY, btnSize, btnSize, 0, 0)
        .setScrollFactor(0).setDepth(104).setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => { bg.clear(); bg.fillStyle(0x2a2a4a, 0.9); bg.fillRoundedRect(x - btnSize / 2, btnY - btnSize / 2, btnSize, btnSize, 6); bg.lineStyle(2, 0x4488cc, 1); bg.strokeRoundedRect(x - btnSize / 2, btnY - btnSize / 2, btnSize, btnSize, 6); });
      hit.on('pointerout', () => { bg.clear(); bg.fillStyle(0x1a1a2a, 0.9); bg.fillRoundedRect(x - btnSize / 2, btnY - btnSize / 2, btnSize, btnSize, 6); bg.lineStyle(1.5, 0x335577, 0.8); bg.strokeRoundedRect(x - btnSize / 2, btnY - btnSize / 2, btnSize, btnSize, 6); });
      hit.on('pointerdown', () => this._queueTrainUnit(key));

      this._unitButtons.push({ key, config, bg, costT });
    });
  }

  _setupCamera(width, height) {
    const startX = this._role === 'host' ? CONFIG.PLAYER_BASE_X - width / 2 : CONFIG.ENEMY_BASE_X - width / 2;
    this.cameras.main.setScroll(Math.max(0, startX), 0);
  }

  _setupKeys() {
    this._keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      left2: Phaser.Input.Keyboard.KeyCodes.LEFT,
      right2: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      u1: Phaser.Input.Keyboard.KeyCodes.ONE,
      u2: Phaser.Input.Keyboard.KeyCodes.TWO,
      u3: Phaser.Input.Keyboard.KeyCodes.THREE,
      u4: Phaser.Input.Keyboard.KeyCodes.FOUR,
      u5: Phaser.Input.Keyboard.KeyCodes.FIVE,
    });

    [this._keys.u1, this._keys.u2, this._keys.u3, this._keys.u4, this._keys.u5].forEach((k, i) => {
      k.on('down', () => {
        const btn = this._unitButtons[i];
        if (btn) this._queueTrainUnit(btn.key);
      });
    });
  }

  _queueTrainUnit(unitKey) {
    if (this._isGameOver) return;
    const cfg = this._getUnitConfig(this._myFaction);
    const unitConfig = cfg[unitKey];
    if (!unitConfig) return;
    if (this._myGold < unitConfig.cost) return;
    if ((this._myCooldowns[unitKey] || 0) > 0) return;

    this._pendingCommands.push({ type: 'train', unitKey });
    this._myGold -= unitConfig.cost;
    this._myCooldowns[unitKey] = unitConfig.cooldown;
  }

  _setupLockstep() {
    const room = this._room;
    this._lockstep = new LockstepEngine(room.room_code, this._role);

    this._lockstep.onTurnReady = (turn, hostCmds, guestCmds) => {
      const myCmds = this._role === 'host' ? hostCmds : guestCmds;
      const oppCmds = this._role === 'host' ? guestCmds : hostCmds;
      this._executeTurn(myCmds, oppCmds);
      if (this._turnText) this._turnText.setText(`T:${turn}`);
    };

    this._lockstep.onWaiting = () => {
      this._isWaiting = true;
      this._waitOverlay.setAlpha(0.45);
      this._waitText.setText('Waiting for\nopponent...');
    };

    this._lockstep.onResumed = () => {
      this._isWaiting = false;
      this._waitOverlay.setAlpha(0);
      this._waitText.setText('');
    };

    this._lockstep.onOpponentDisconnect = () => {
      this._endGame(true, true);
    };

    this._lockstep.start();
  }

  _executeTurn(myCmds, oppCmds) {
    if (this._isGameOver) return;

    const myIsLeft = this._role === 'host';

    myCmds.forEach(cmd => {
      if (cmd.type === 'train') {
        const cfg = this._getUnitConfig(this._myFaction);
        const unitConfig = cfg[cmd.unitKey];
        if (unitConfig) {
          const unit = this._spawnUnit(this._myFaction, cmd.unitKey, this._myBaseX, !myIsLeft);
          if (unit) this._myUnits.push(unit);
        }
      }
    });

    oppCmds.forEach(cmd => {
      if (cmd.type === 'train') {
        const cfg = this._getUnitConfig(this._opponentFaction);
        const unitConfig = cfg[cmd.unitKey];
        if (unitConfig) {
          const unit = this._spawnUnit(this._opponentFaction, cmd.unitKey, this._oppBaseX, myIsLeft);
          if (unit) this._oppUnits.push(unit);
        }
      }
    });

    this._myGold += CONFIG.GOLD_PER_SECOND * 0.2;
    this._myMana = Math.min(100, this._myMana + CONFIG.MANA_REGEN * 0.2);
    this._oppGold += CONFIG.GOLD_PER_SECOND * 0.2;
    this._oppMana = Math.min(100, this._oppMana + CONFIG.MANA_REGEN * 0.2);

    Object.keys(this._myCooldowns).forEach(k => {
      if (this._myCooldowns[k] > 0) this._myCooldowns[k] -= 200;
    });
    Object.keys(this._oppCooldowns).forEach(k => {
      if (this._oppCooldowns[k] > 0) this._oppCooldowns[k] -= 200;
    });

    this._pendingCommands = [];

    const myIsEnemy = !myIsLeft;
    this._myUnits.forEach(u => {
      u.scene.playerUnits = this._myUnits;
      u.scene.enemyUnits = this._oppUnits;
      u.scene.playerBase = this._myBase;
      u.scene.enemyBase = this._oppBase;
    });
    this._oppUnits.forEach(u => {
      u.scene.playerUnits = this._oppUnits;
      u.scene.enemyUnits = this._myUnits;
      u.scene.playerBase = this._oppBase;
      u.scene.enemyBase = this._myBase;
    });
  }

  _collectAndSubmitCommands() {
    const cmds = [...this._pendingCommands];
    this._pendingCommands = [];
    this._lockstep.queueCommand(...cmds);
    cmds.forEach(c => this._lockstep.queueCommand(c));
  }

  update(time, delta) {
    if (this._isGameOver) return;

    const speed = 7;
    if (this._keys.left.isDown || this._keys.left2.isDown) {
      this.cameras.main.scrollX -= speed;
    }
    if (this._keys.right.isDown || this._keys.right2.isDown) {
      this.cameras.main.scrollX += speed;
    }

    if (this._goldText) this._goldText.setText(`${Math.floor(this._myGold)}`);
    if (this._manaText) this._manaText.setText(`${Math.floor(this._myMana)}`);

    this._myUnits = this._myUnits.filter(u => !u.isDead);
    this._oppUnits = this._oppUnits.filter(u => !u.isDead);

    this._myUnits.forEach(u => u.update(time, delta));
    this._oppUnits.forEach(u => u.update(time, delta));

    if (this._myBase?.isDead && !this._isGameOver) {
      this._endGame(false, false);
    } else if (this._oppBase?.isDead && !this._isGameOver) {
      this._endGame(true, false);
    }
  }

  async _endGame(won, forfeit) {
    if (this._isGameOver) return;
    this._isGameOver = true;

    this._lockstep?.stop();
    MultiplayerNetwork.stopHeartbeat();

    const room = this._room;
    const mySessionId = this._sessionId;
    const oppSessionId = this._role === 'host' ? room.guest_session_id : room.host_session_id;

    const gameTime = Math.floor((this.time.now - this._gameStartTime) / 1000);

    try {
      if (!forfeit) {
        await MultiplayerNetwork.saveResult(
          room.room_code,
          won ? mySessionId : oppSessionId,
          won ? oppSessionId : mySessionId,
          room.host_faction,
          room.guest_faction,
          this._lockstep?.getTurnCount() || 0
        );
      }
    } catch {}

    this.registry.set('onlineResult', {
      won,
      forfeit,
      gameTime,
      myFaction: this._myFaction,
      oppFaction: this._opponentFaction,
      myDisplayName: this._myDisplayName,
      oppDisplayName: this._oppDisplayName,
      room: this._room,
      role: this._role,
      sessionId: mySessionId,
    });

    this.cameras.main.fade(600, 0, 0, 0);
    this.time.delayedCall(600, () => {
      this.scene.start('MultiplayerVictoryScene');
    });
  }

  shutdown() {
    this._lockstep?.stop();
    MultiplayerNetwork.unsubscribeAll();
  }
}
