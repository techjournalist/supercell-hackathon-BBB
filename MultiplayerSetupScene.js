import Phaser from 'phaser';
import { ProfileManager } from './ProfileManager.js';
import { MultiplayerNetwork } from './MultiplayerNetwork.js';
import { FriendsManager } from './FriendsManager.js';

const FACTIONS = [
  { key: 'roman', label: 'ROMANS', icon: '🛡️', fill: 0x8B4513, border: 0xFFD700, textColor: '#FFD700' },
  { key: 'viking', label: 'VIKINGS', icon: '⚔️', fill: 0x4A7BA7, border: 0x87CEEB, textColor: '#87CEEB' },
  { key: 'alien', label: 'ALIENS', icon: '👽', fill: 0x1a3a1a, border: 0x00FF88, textColor: '#00FF88' },
];

export class MultiplayerSetupScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MultiplayerSetupScene' });
  }

  preload() {
    this.load.image('menu-bg', 'https://rosebud.ai/assets/menu-screen.jpeg?D4E2');
  }

  create() {
    const { width, height } = this.scale;

    this._mode = null;
    this._faction = null;
    this._searching = false;
    this._roomData = null;
    this._countdownTimer = null;
    this._elements = {};
    this._centerGroup = [];

    const bg = this.add.image(width / 2, 0, 'menu-bg');
    bg.setOrigin(0.5, 0);
    const scale = Math.max(width / bg.width, height / bg.height);
    bg.setScale(scale);

    this.add.rectangle(0, 0, width, height, 0x000000, 0.55).setOrigin(0);

    this._drawTitle(width, height);
    this._drawModeSelect(width, height);
    this._drawBackButton(width, height);

  }

  _drawTitle(width, height) {
    const titleFS = Math.max(18, Math.min(width * 0.04, 42));
    this.add.text(width / 2, height * 0.12, 'MULTIPLAYER', {
      fontSize: `${titleFS}px`,
      fontFamily: 'Press Start 2P',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: Math.max(3, titleFS * 0.14),
    }).setOrigin(0.5);
  }

  _drawModeSelect(width, height) {
    const modes = [
      { key: 'local', label: 'LOCAL\nSPLIT-SCREEN', icon: '🖥️', sub: 'Same device, two players', color: 0x2a4a8a, border: 0x6699ff },
      { key: 'online', label: 'ONLINE\nMULTIPLAYER', icon: '🌐', sub: 'Play with friends online', color: 0x1a5a2a, border: 0x44dd66 },
    ];

    const cardW = Math.min(320, (width - 80) / 2);
    const cardH = Math.min(220, height * 0.5);
    const gap = Math.min(32, width * 0.03);
    const startX = width / 2 - cardW - gap / 2;
    const y = height * 0.48;

    const labelFS = Math.max(12, Math.min(width * 0.018, 18));
    const label = this.add.text(width / 2, height * 0.23, 'Choose a mode:', {
      fontSize: `${labelFS}px`, fontFamily: 'Arial', color: '#cccccc',
    }).setOrigin(0.5);
    this._elements.modeLabel = label;

    this._modeCards = [];
    modes.forEach((mode, i) => {
      const x = startX + i * (cardW + gap);
      const card = this._makeModeCard(x, y - cardH / 2, cardW, cardH, mode);
      this._modeCards.push(card);
    });
  }

  _makeModeCard(x, y, w, h, mode) {
    const bg = this.add.graphics();
    bg.fillStyle(mode.color, 0.85);
    bg.fillRoundedRect(x, y, w, h, 14);
    bg.lineStyle(2, mode.border, 0.8);
    bg.strokeRoundedRect(x, y, w, h, 14);

    const iconFS = Math.max(24, Math.min(w * 0.12, 40));
    const labelFS = Math.max(10, Math.min(w * 0.05, 16));
    const subFS = Math.max(8, Math.min(w * 0.035, 11));
    const iconText = this.add.text(x + w / 2, y + h * 0.18, mode.icon, { fontSize: `${iconFS}px` }).setOrigin(0.5);
    const labelText = this.add.text(x + w / 2, y + h * 0.43, mode.label, {
      fontSize: `${labelFS}px`, fontFamily: 'Press Start 2P', color: '#ffffff',
      align: 'center', lineSpacing: 6,
    }).setOrigin(0.5);
    const subText = this.add.text(x + w / 2, y + h - h * 0.14, mode.sub, {
      fontSize: `${subFS}px`, fontFamily: 'Arial', color: '#aaaaaa', align: 'center',
    }).setOrigin(0.5);

    const hit = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0)
      .setInteractive({ useHandCursor: true });

    hit.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(mode.border, 0.25);
      bg.fillRoundedRect(x, y, w, h, 14);
      bg.lineStyle(3, mode.border, 1);
      bg.strokeRoundedRect(x, y, w, h, 14);
    });
    hit.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(mode.color, 0.85);
      bg.fillRoundedRect(x, y, w, h, 14);
      bg.lineStyle(2, mode.border, 0.8);
      bg.strokeRoundedRect(x, y, w, h, 14);
    });
    hit.on('pointerdown', () => {
      if (mode.key === 'local') {
        this._showLocalSetup();
      } else {
        this._showOnlineSetup();
      }
    });

    return { bg, iconText, labelText, subText, hit };
  }

  _clearCenter() {
    this._centerGroup.forEach(e => { try { e.destroy(); } catch {} });
    this._centerGroup = [];
    if (this._modeCards) {
      this._modeCards.forEach(c => {
        [c.bg, c.iconText, c.labelText, c.subText, c.hit].forEach(e => { try { e.destroy(); } catch {} });
      });
      this._modeCards = null;
    }
    if (this._elements.modeLabel) {
      this._elements.modeLabel.destroy();
      this._elements.modeLabel = null;
    }
  }

  _track(obj) {
    this._centerGroup.push(obj);
    return obj;
  }

  // ----------------------------------------------------------------
  // LOCAL SETUP
  // ----------------------------------------------------------------
  _showLocalSetup() {
    const { width, height } = this.scale;
    this._clearCenter();
    this._mode = 'local';

    this._track(this.add.text(width / 2, height * 0.2, 'LOCAL SPLIT-SCREEN', {
      fontSize: '26px', fontFamily: 'Press Start 2P', color: '#6699ff',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5));

    this._track(this.add.text(width / 2, height * 0.28, 'Each player selects a faction', {
      fontSize: '15px', fontFamily: 'Arial', color: '#cccccc',
    }).setOrigin(0.5));

    this.player1Faction = null;
    this.player2Faction = null;

    this._createPlayerSection(1, width / 2, height * 0.47);
    this._createPlayerSection(2, width / 2, height * 0.73);

    this._localStartBtn = this._track(this.add.rectangle(width / 2, height - 60, 280, 50, 0x444444));
    this._localStartBtn.setStrokeStyle(3, 0x888888);
    this._localStartTxt = this._track(this.add.text(width / 2, height - 60, 'START MATCH', {
      fontSize: '18px', fontFamily: 'Press Start 2P', color: '#888888',
    }).setOrigin(0.5));

    this._track(this._makeTextButton(width / 2 - 220, height - 60, '← BACK', () => {
      this._clearCenter();
      this._mode = null;
      this._drawModeSelect(width, height);
    }));
  }

  _createPlayerSection(playerNum, centerX, centerY) {
    const color = playerNum === 1 ? '#4488FF' : '#FF4488';

    this._track(this.add.text(centerX, centerY - 52, `PLAYER ${playerNum}`, {
      fontSize: '20px', fontFamily: 'Press Start 2P', color,
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5));

    const statusKey = `p${playerNum}Status`;
    this._elements[statusKey] = this._track(this.add.text(centerX, centerY - 26, 'Choose faction:', {
      fontSize: '13px', fontFamily: 'Arial', color: '#ffffff',
    }).setOrigin(0.5));

    FACTIONS.forEach((f, i) => {
      const x = centerX - 180 + i * 180;
      const btn = this._track(this.add.rectangle(x, centerY + 14, 140, 56, f.fill));
      btn.setStrokeStyle(2, f.border);
      btn.setInteractive({ useHandCursor: true });

      this._track(this.add.text(x - 22, centerY + 12, f.icon, { fontSize: '20px' }).setOrigin(0.5));
      this._track(this.add.text(x + 18, centerY + 14, f.label, {
        fontSize: '9px', fontFamily: 'Press Start 2P', color: f.textColor,
      }).setOrigin(0.5));

      btn.on('pointerover', () => btn.setAlpha(0.8));
      btn.on('pointerout', () => btn.setAlpha(1));
      btn.on('pointerdown', () => {
        if (playerNum === 1) { this.player1Faction = f.key; }
        else { this.player2Faction = f.key; }
        this._elements[statusKey].setText(`Selected: ${f.label}`);
        this._elements[statusKey].setColor(f.textColor);
        this._updateLocalStartButton();
      });
    });
  }

  _updateLocalStartButton() {
    if (!this.player1Faction || !this.player2Faction) return;
    if (!this._localStartBtn) return;

    this._localStartBtn.setFillStyle(0x007700);
    this._localStartBtn.setStrokeStyle(3, 0x00ff00);
    this._localStartTxt.setColor('#ffffff');
    this._localStartBtn.setInteractive({ useHandCursor: true });
    this._localStartBtn.removeAllListeners('pointerdown');
    this._localStartBtn.on('pointerover', () => this._localStartBtn.setFillStyle(0x009900));
    this._localStartBtn.on('pointerout', () => this._localStartBtn.setFillStyle(0x007700));
    this._localStartBtn.on('pointerdown', () => {
      this.registry.set('multiplayerMode', true);
      this.registry.set('player1Faction', this.player1Faction);
      this.registry.set('player2Faction', this.player2Faction);
      this.cameras.main.fade(400, 0, 0, 0);
      this.time.delayedCall(400, () => this.scene.start('MultiplayerGameScene'));
    });
  }

  // ----------------------------------------------------------------
  // ONLINE SETUP
  // ----------------------------------------------------------------
  _showOnlineSetup() {
    const { width, height } = this.scale;
    this._clearCenter();
    this._mode = 'online';
    this._faction = null;

    this._track(this.add.text(width / 2, height * 0.17, 'ONLINE MULTIPLAYER', {
      fontSize: '24px', fontFamily: 'Press Start 2P', color: '#44dd66',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5));

    this._track(this.add.text(width / 2, height * 0.25, 'Select your faction:', {
      fontSize: '14px', fontFamily: 'Arial', color: '#cccccc',
    }).setOrigin(0.5));

    this._drawFactionPicker(width, height * 0.33);
    this._drawOnlineOptions(width, height);

    this._track(this._makeTextButton(80, height - 40, '← BACK', () => {
      this._cancelSearch();
      this._clearCenter();
      this._mode = null;
      this._drawModeSelect(width, height);
    }));
  }

  _drawFactionPicker(width, y) {
    this._factionBtns = [];
    FACTIONS.forEach((f, i) => {
      const x = width / 2 - 200 + i * 200;
      const bg = this.add.graphics();
      this._track(bg);
      this._drawFactionBtnGfx(bg, x - 80, y, 160, 80, f, false);

      const hit = this._track(this.add.rectangle(x, y + 40, 160, 80, 0, 0)
        .setInteractive({ useHandCursor: true }));

      this._track(this.add.text(x - 16, y + 28, f.icon, { fontSize: '22px' }).setOrigin(0.5));
      this._track(this.add.text(x + 22, y + 42, f.label, {
        fontSize: '10px', fontFamily: 'Press Start 2P', color: f.textColor,
      }).setOrigin(0.5));

      hit.on('pointerdown', () => {
        this._faction = f.key;
        this._factionBtns.forEach((b, j) => {
          this._drawFactionBtnGfx(b.bg, b.bx, b.by, 160, 80, FACTIONS[j], j === i);
        });
        this._setStatus('');
      });

      this._factionBtns.push({ bg, bx: x - 80, by: y, faction: f });
    });
  }

  _drawFactionBtnGfx(g, x, y, w, h, f, active) {
    g.clear();
    g.fillStyle(active ? f.border : f.fill, active ? 0.3 : 0.8);
    g.fillRoundedRect(x, y, w, h, 10);
    g.lineStyle(active ? 3 : 1.5, f.border, active ? 1 : 0.6);
    g.strokeRoundedRect(x, y, w, h, 10);
  }

  _drawOnlineOptions(width, height) {
    const btnY = height * 0.65;
    const btnW = Math.min(220, (width - 80) / 3);
    const gap = 20;
    const totalW = btnW * 3 + gap * 2;
    const startX = width / 2 - totalW / 2;

    const options = [
      { key: 'random', label: 'RANDOM\nMATCH', icon: '🎲', color: 0x1a3a5a, border: 0x4488cc },
      { key: 'create', label: 'CREATE\nROOM', icon: '📋', color: 0x3a2a1a, border: 0xcc8844 },
      { key: 'join', label: 'JOIN BY\nCODE', icon: '🔑', color: 0x1a3a1a, border: 0x44cc88 },
    ];

    options.forEach((opt, i) => {
      const x = startX + i * (btnW + gap);
      this._makeOnlineOptionBtn(x, btnY - 55, btnW, 110, opt);
    });

    this._statusText = this._track(this.add.text(width / 2, height * 0.84, '', {
      fontSize: '14px', fontFamily: 'Arial', color: '#aaaaaa', align: 'center',
    }).setOrigin(0.5));
  }

  _makeOnlineOptionBtn(x, y, w, h, opt) {
    const bg = this.add.graphics();
    this._track(bg);
    const drawBg = (hover) => {
      bg.clear();
      bg.fillStyle(hover ? opt.border : opt.color, hover ? 0.2 : 0.85);
      bg.fillRoundedRect(x, y, w, h, 12);
      bg.lineStyle(hover ? 3 : 2, opt.border, hover ? 1 : 0.7);
      bg.strokeRoundedRect(x, y, w, h, 12);
    };
    drawBg(false);

    this._track(this.add.text(x + w / 2, y + 28, opt.icon, { fontSize: '26px' }).setOrigin(0.5));
    this._track(this.add.text(x + w / 2, y + 68, opt.label, {
      fontSize: '11px', fontFamily: 'Press Start 2P', color: '#ffffff',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5));

    const hit = this._track(this.add.rectangle(x + w / 2, y + h / 2, w, h, 0, 0)
      .setInteractive({ useHandCursor: true }));

    hit.on('pointerover', () => drawBg(true));
    hit.on('pointerout', () => drawBg(false));
    hit.on('pointerdown', () => {
      if (!this._faction) {
        this._setStatus('Select a faction first!', '#ff8844');
        return;
      }
      this._handleOnlineOption(opt.key);
    });
  }

  _setStatus(msg, color = '#aaaaaa') {
    if (this._statusText) {
      this._statusText.setText(msg);
      this._statusText.setColor(color);
    }
  }

  async _handleOnlineOption(key) {
    if (this._searching) return;

    const profile = ProfileManager.getActive();
    const sessionId = profile?.sessionId || localStorage.getItem('gameSessionId');
    const displayName = profile?.name || 'Commander';

    if (key === 'random') {
      this._searching = true;
      this._setStatus('Searching for a match...', '#44dd66');
      try {
        const room = await MultiplayerNetwork.findRandomRoom(sessionId, displayName, this._faction);
        this._roomData = room;
        if (room.status === 'countdown') {
          this._enterLobby(room, room.host_session_id === sessionId ? 'host' : 'guest');
        } else {
          this._waitForGuest(room);
        }
      } catch (e) {
        this._searching = false;
        this._setStatus('Failed to find match. Try again.', '#ff4444');
      }

    } else if (key === 'create') {
      this._searching = true;
      this._setStatus('Creating room...', '#ccaa44');
      try {
        const room = await MultiplayerNetwork.createRoom(sessionId, displayName, this._faction, 'friend_code');
        this._roomData = room;
        this._showRoomCodeLobby(room, sessionId);
      } catch (e) {
        this._searching = false;
        this._setStatus('Failed to create room.', '#ff4444');
      }

    } else if (key === 'join') {
      this._showJoinCodeInput();
    }
  }

  _waitForGuest(room) {
    this._setStatus('Waiting for opponent...', '#44dd66');
    MultiplayerNetwork.subscribeToRoom(room.room_code, (updated) => {
      if (updated && updated.status === 'countdown') {
        this._roomData = updated;
        this._enterLobby(updated, 'host');
      } else if (updated && updated.status === 'abandoned') {
        this._searching = false;
        this._setStatus('Match was cancelled.', '#ff4444');
      }
    });
  }

  _showRoomCodeLobby(room, sessionId) {
    const { width, height } = this.scale;

    const panel = this._track(this.add.graphics());
    const pw = 460, ph = 160;
    const px = width / 2 - pw / 2, py = height * 0.77 - ph / 2;
    panel.fillStyle(0x0a1520, 0.95);
    panel.fillRoundedRect(px, py, pw, ph, 14);
    panel.lineStyle(2, 0x4488cc, 0.9);
    panel.strokeRoundedRect(px, py, pw, ph, 14);

    this._track(this.add.text(width / 2, py + 26, 'YOUR ROOM CODE', {
      fontSize: '11px', fontFamily: 'Arial', color: '#7a9abc', letterSpacing: 3,
    }).setOrigin(0.5));

    this._track(this.add.text(width / 2, py + 72, room.room_code, {
      fontSize: '40px', fontFamily: 'Press Start 2P', color: '#ffcc44',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5));

    this._track(this.add.text(width / 2, py + 110, 'Share this code with a friend', {
      fontSize: '11px', fontFamily: 'Arial', color: '#666666',
    }).setOrigin(0.5));

    const cancelTxt = this._track(this.add.text(px + pw - 16, py + 12, '✕', {
      fontSize: '14px', fontFamily: 'Arial', color: '#884422',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
    cancelTxt.on('pointerdown', () => this._cancelSearch());

    this._setStatus('Waiting for opponent to join...', '#44dd66');

    MultiplayerNetwork.subscribeToRoom(room.room_code, (updated) => {
      if (updated && updated.status === 'countdown') {
        this._roomData = updated;
        this._enterLobby(updated, 'host');
      }
    });

    this._loadFriendsForInvite(room.room_code, sessionId, width, py + ph + 20);
  }

  async _loadFriendsForInvite(roomCode, sessionId, width, startY) {
    try {
      const friends = await FriendsManager.getOnlineFriends(sessionId);
      if (friends.length === 0) return;

      this._track(this.add.text(width / 2, startY + 12, 'INVITE A FRIEND', {
        fontSize: '10px', fontFamily: 'Arial', color: '#5a7a9a', letterSpacing: 2,
      }).setOrigin(0.5));

      friends.slice(0, 4).forEach((f, i) => {
        const name = f.presence?.display_name || f.sessionId.slice(0, 8);
        const isOnline = f.isOnline;
        const bx = width / 2 - 280 + i * 188;
        const by = startY + 44;

        const fbg = this._track(this.add.graphics());
        fbg.fillStyle(0x0a1a0a, 0.9);
        fbg.fillRoundedRect(bx - 85, by - 18, 170, 36, 7);
        fbg.lineStyle(1, isOnline ? 0x337755 : 0x333333, 0.7);
        fbg.strokeRoundedRect(bx - 85, by - 18, 170, 36, 7);

        this._track(this.add.text(bx - 70, by, isOnline ? '●' : '○', {
          fontSize: '10px', fontFamily: 'Arial',
          color: isOnline ? '#44ff88' : '#555555',
        }).setOrigin(0, 0.5));

        this._track(this.add.text(bx - 54, by, name.substring(0, 10), {
          fontSize: '11px', fontFamily: 'Arial', color: '#cccccc',
        }).setOrigin(0, 0.5));

        const invBtn = this._track(this.add.text(bx + 62, by, 'INVITE', {
          fontSize: '8px', fontFamily: 'Arial', color: '#44cc88', letterSpacing: 1,
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }));

        invBtn.on('pointerdown', () => {
          invBtn.setText('SENT!').setColor('#888888').removeInteractive();
        });
      });
    } catch {}
  }

  _showJoinCodeInput() {
    const { width, height } = this.scale;

    const overlay = this._track(this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0));
    const dw = 440, dh = 180;
    const dx = width / 2 - dw / 2, dy = height / 2 - dh / 2;

    const dlg = this._track(this.add.graphics());
    dlg.fillStyle(0x0a1520, 1);
    dlg.fillRoundedRect(dx, dy, dw, dh, 14);
    dlg.lineStyle(2, 0x44cc88, 0.9);
    dlg.strokeRoundedRect(dx, dy, dw, dh, 14);

    this._track(this.add.text(width / 2, dy + 32, 'ENTER ROOM CODE', {
      fontSize: '15px', fontFamily: 'Press Start 2P', color: '#e8d5a3',
    }).setOrigin(0.5));

    this._track(this.add.text(width / 2, dy + 66, 'Ask your friend for their 6-character code', {
      fontSize: '11px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5));

    const joinBg = this._track(this.add.graphics());
    const drawJoin = (h) => {
      joinBg.clear();
      joinBg.fillStyle(h ? 0x3a6a4a : 0x1a3a2a, 0.95);
      joinBg.fillRoundedRect(width / 2 - 65, dy + dh - 50, 130, 34, 6);
      joinBg.lineStyle(1.5, 0x44cc88, h ? 1 : 0.8);
      joinBg.strokeRoundedRect(width / 2 - 65, dy + dh - 50, 130, 34, 6);
    };
    drawJoin(false);

    this._track(this.add.text(width / 2, dy + dh - 33, 'JOIN ROOM', {
      fontSize: '11px', fontFamily: 'Arial', color: '#e8d5a3', fontStyle: 'bold', letterSpacing: 2,
    }).setOrigin(0.5));

    const joinHit = this._track(this.add.rectangle(width / 2, dy + dh - 33, 130, 34, 0, 0)
      .setInteractive({ useHandCursor: true }));
    joinHit.on('pointerover', () => drawJoin(true));
    joinHit.on('pointerout', () => drawJoin(false));
    joinHit.on('pointerdown', () => {
      const code = prompt('Enter the 6-character room code:');
      if (code && code.trim().length >= 4) {
        [overlay, dlg, joinBg, joinHit].forEach(e => e.destroy());
        this._joinByCode(code.trim().toUpperCase());
      }
    });

    const cancelTxt = this._track(this.add.text(dx + dw - 16, dy + 12, '✕', {
      fontSize: '16px', fontFamily: 'Arial', color: '#885544',
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }));
    cancelTxt.on('pointerdown', () => {
      [overlay, dlg, joinBg, joinHit, cancelTxt].forEach(e => { try { e.destroy(); } catch {} });
    });
  }

  async _joinByCode(code) {
    if (this._searching) return;
    this._searching = true;
    this._setStatus(`Joining room ${code}...`, '#44dd66');

    const profile = ProfileManager.getActive();
    const sessionId = profile?.sessionId || localStorage.getItem('gameSessionId');
    const displayName = profile?.name || 'Commander';

    try {
      const room = await MultiplayerNetwork.joinRoom(code, sessionId, displayName, this._faction);
      this._roomData = room;
      this._enterLobby(room, 'guest');
    } catch (e) {
      this._searching = false;
      this._setStatus(e.message || 'Could not join room.', '#ff4444');
    }
  }

  _enterLobby(room, role) {
    this._setStatus('Opponent found! Get ready...', '#44ff88');
    this.registry.set('onlineRoom', room);
    this.registry.set('onlineRole', role);

    let count = 3;
    const countText = this._track(this.add.text(
      this.scale.width / 2, this.scale.height * 0.92,
      `Starting in ${count}...`, {
        fontSize: '20px', fontFamily: 'Press Start 2P', color: '#ffffff',
        stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5));

    this.time.addEvent({
      delay: 1000,
      repeat: count - 1,
      callback: () => {
        count--;
        if (count <= 0) {
          this.cameras.main.fade(400, 0, 0, 0);
          this.time.delayedCall(400, () => {
            MultiplayerNetwork.unsubscribeAll();
            this.scene.start('OnlineGameScene');
          });
        } else {
          countText.setText(`Starting in ${count}...`);
        }
      },
    });
  }

  _cancelSearch() {
    this._searching = false;
    MultiplayerNetwork.unsubscribeAll();
    this._setStatus('', '#aaaaaa');
  }

  _makeTextButton(x, y, label, callback) {
    const txt = this.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'Arial', color: '#5a4a2a', letterSpacing: 2,
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true });
    txt.on('pointerover', () => txt.setColor('#c9941a'));
    txt.on('pointerout', () => txt.setColor('#5a4a2a'));
    txt.on('pointerdown', callback);
    return txt;
  }

  _drawBackButton(width, height) {
    const backFS = Math.max(9, Math.min(width * 0.013, 12));
    const back = this.add.text(width * 0.08, height - Math.min(36, height * 0.08), '← MAIN MENU', {
      fontSize: `${backFS}px`, fontFamily: 'Arial', color: '#5a4a2a', letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor('#c9941a'));
    back.on('pointerout', () => back.setColor('#5a4a2a'));
    back.on('pointerdown', () => {
      this._cancelSearch();
      this.scene.start('MenuScene');
    });
  }
}
