import Phaser from 'phaser';
import { ProfileManager } from './ProfileManager.js';
import { FriendsManager } from './FriendsManager.js';

const GOLD = '#c9941a';
const DARK_BG = 0x08060e;
const PANEL_BG = 0x100a18;
const BORDER = 0xc9941a;

const TABS = ['FRIENDS', 'REQUESTS', 'FIND'];

export class FriendsScene extends Phaser.Scene {
  constructor() {
    super({ key: 'FriendsScene' });
  }

  init(data) {
    this._fromScene = data?.from || 'MenuScene';
  }

  create() {
    const { width, height } = this.scale;

    this._sessionId = null;
    this._displayName = 'Commander';
    const profile = ProfileManager.getActive();
    if (profile) {
      this._sessionId = profile.sessionId;
      this._displayName = profile.name;
    } else {
      let id = localStorage.getItem('gameSessionId');
      if (!id) { id = crypto.randomUUID(); localStorage.setItem('gameSessionId', id); }
      this._sessionId = id;
    }

    this._activeTab = 0;
    this._tabContent = [];
    this._friends = [];
    this._requests = [];
    this._searchResults = [];

    this._drawBackground(width, height);
    this._drawHeader(width, height);
    this._drawTabs(width, height);
    this._drawContentArea(width, height);
    this._drawBackButton(width, height);

    this._loadTab(0);

    FriendsManager.subscribeFriendsChanges(this._sessionId, () => {
      this._loadTab(this._activeTab);
    });

    FriendsManager.startPresenceHeartbeat(this._sessionId, this._displayName, () => ({
      status: 'online',
      roomCode: null,
    }));
  }

  shutdown() {
    FriendsManager.unsubscribeAll();
  }

  _drawBackground(width, height) {
    this.add.rectangle(0, 0, width, height, DARK_BG).setOrigin(0);

    const grad = this.add.graphics();
    grad.fillGradientStyle(0x1a0e04, 0x1a0e04, DARK_BG, DARK_BG, 0.7, 0.7, 1, 1);
    grad.fillRect(0, 0, width, height / 2);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
      const star = this.add.circle(x, y, Phaser.Math.FloatBetween(1, 2), 0xffffff, alpha);
      this.tweens.add({
        targets: star, alpha: { from: alpha, to: alpha * 0.2 },
        duration: Phaser.Math.Between(1200, 3000), yoyo: true, repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  _drawHeader(width, height) {
    this.add.text(width / 2, height * 0.1, 'FRIENDS', {
      fontSize: '32px', fontFamily: 'Press Start 2P, Arial', color: '#e8d5a3',
      stroke: '#3a1a00', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.1 + 46, `Your ID: ${this._sessionId?.slice(0, 12)}...`, {
      fontSize: '10px', fontFamily: 'Arial', color: '#5a4a2a', letterSpacing: 1,
    }).setOrigin(0.5);
  }

  _drawTabs(width, height) {
    const tabY = height * 0.22;
    const tabW = 160;
    const gap = 12;
    const totalW = tabW * 3 + gap * 2;
    const startX = width / 2 - totalW / 2;

    this._tabBgs = [];
    this._tabTexts = [];

    TABS.forEach((label, i) => {
      const x = startX + i * (tabW + gap);
      const bg = this.add.graphics();
      const txt = this.add.text(x + tabW / 2, tabY + 18, label, {
        fontSize: '11px', fontFamily: 'Press Start 2P, Arial', color: i === 0 ? GOLD : '#5a4a2a',
      }).setOrigin(0.5);

      this._drawTabBg(bg, x, tabY, tabW, 36, i === 0);
      this._tabBgs.push({ g: bg, x, y: tabY, w: tabW });
      this._tabTexts.push(txt);

      const hit = this.add.rectangle(x + tabW / 2, tabY + 18, tabW, 36, 0, 0)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerdown', () => this._switchTab(i));
    });
  }

  _drawTabBg(g, x, y, w, h, active) {
    g.clear();
    g.fillStyle(active ? 0x1a0f03 : PANEL_BG, 0.95);
    g.fillRoundedRect(x, y, w, h, 6);
    g.lineStyle(active ? 2 : 1, BORDER, active ? 1 : 0.3);
    g.strokeRoundedRect(x, y, w, h, 6);
  }

  _switchTab(idx) {
    this._activeTab = idx;
    this._tabBgs.forEach(({ g, x, y, w }, i) => this._drawTabBg(g, x, y, w, 36, i === idx));
    this._tabTexts.forEach((t, i) => t.setColor(i === idx ? GOLD : '#5a4a2a'));
    this._clearContent();
    this._loadTab(idx);
  }

  _drawContentArea(width, height) {
    const areaY = height * 0.31;
    const areaH = height * 0.58;
    const g = this.add.graphics();
    g.fillStyle(PANEL_BG, 0.7);
    g.fillRoundedRect(width * 0.1, areaY, width * 0.8, areaH, 12);
    g.lineStyle(1, BORDER, 0.25);
    g.strokeRoundedRect(width * 0.1, areaY, width * 0.8, areaH, 12);
    this._contentAreaY = areaY + 20;
    this._contentAreaX = width * 0.1 + 20;
    this._contentAreaW = width * 0.8 - 40;
    this._contentAreaH = areaH - 40;
  }

  _clearContent() {
    this._tabContent.forEach(e => { try { e.destroy(); } catch {} });
    this._tabContent = [];
  }

  _tc(obj) {
    this._tabContent.push(obj);
    return obj;
  }

  async _loadTab(idx) {
    this._clearContent();
    const { width } = this.scale;

    if (idx === 0) {
      await this._loadFriends(width);
    } else if (idx === 1) {
      await this._loadRequests(width);
    } else {
      this._buildFindTab(width);
    }
  }

  // ----------------------------------------------------------------
  // FRIENDS TAB
  // ----------------------------------------------------------------
  async _loadFriends(width) {
    const cx = this._contentAreaX;
    const cy = this._contentAreaY;
    const cw = this._contentAreaW;

    const loading = this._tc(this.add.text(width / 2, cy + 40, 'Loading...', {
      fontSize: '12px', fontFamily: 'Arial', color: '#5a4a2a',
    }).setOrigin(0.5));

    try {
      const friends = await FriendsManager.getOnlineFriends(this._sessionId);
      loading.destroy();

      if (friends.length === 0) {
        this._tc(this.add.text(width / 2, cy + 60, 'No friends yet.\nUse the FIND tab to add someone!', {
          fontSize: '13px', fontFamily: 'Arial', color: '#5a4a2a', align: 'center', lineSpacing: 6,
        }).setOrigin(0.5));
        return;
      }

      friends.forEach((f, i) => {
        const y = cy + i * 64;
        this._drawFriendRow(f, cx, y, cw);
      });
    } catch {
      loading.setText('Could not load friends.');
    }
  }

  _drawFriendRow(f, x, y, w) {
    const name = f.presence?.display_name || f.sessionId.slice(0, 12) + '...';
    const isOnline = f.isOnline;
    const status = f.presence?.status || 'offline';
    const statusColor = isOnline
      ? (status === 'in-match' ? '#ff8844' : '#44ff88')
      : '#444444';
    const statusLabel = isOnline
      ? (status === 'in-match' ? 'In Match' : status === 'in-lobby' ? 'In Lobby' : 'Online')
      : 'Offline';

    const bg = this._tc(this.add.graphics());
    bg.fillStyle(0x0a0810, 0.8);
    bg.fillRoundedRect(x, y, w, 52, 8);
    bg.lineStyle(1, isOnline ? 0x2a4a2a : 0x1a1a1a, 0.7);
    bg.strokeRoundedRect(x, y, w, 52, 8);

    this._tc(this.add.circle(x + 22, y + 26, 7, isOnline ? 0x44ff88 : 0x333333));

    this._tc(this.add.text(x + 40, y + 14, name, {
      fontSize: '13px', fontFamily: 'Arial', color: '#e8d5a3',
    }));
    this._tc(this.add.text(x + 40, y + 33, statusLabel, {
      fontSize: '10px', fontFamily: 'Arial', color: statusColor,
    }));

    const removeBtn = this._tc(this.add.text(x + w - 10, y + 26, 'REMOVE', {
      fontSize: '9px', fontFamily: 'Arial', color: '#884422',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    removeBtn.on('pointerover', () => removeBtn.setColor('#cc4422'));
    removeBtn.on('pointerout', () => removeBtn.setColor('#884422'));
    removeBtn.on('pointerdown', async () => {
      await FriendsManager.removeFriend(this._sessionId, f.sessionId);
      this._loadTab(0);
    });

    if (isOnline && status === 'in-lobby' && f.presence?.current_room_code) {
      const joinBtn = this._tc(this.add.text(x + w - 80, y + 26, 'JOIN', {
        fontSize: '9px', fontFamily: 'Arial', color: '#44cc88',
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
      joinBtn.on('pointerdown', () => {
        this.registry.set('joinRoomCode', f.presence.current_room_code);
        this.scene.start('MultiplayerSetupScene');
      });
    }
  }

  // ----------------------------------------------------------------
  // REQUESTS TAB
  // ----------------------------------------------------------------
  async _loadRequests(width) {
    const cx = this._contentAreaX;
    const cy = this._contentAreaY;
    const cw = this._contentAreaW;

    const loading = this._tc(this.add.text(width / 2, cy + 40, 'Loading...', {
      fontSize: '12px', fontFamily: 'Arial', color: '#5a4a2a',
    }).setOrigin(0.5));

    try {
      const reqs = await FriendsManager.getPendingRequests(this._sessionId);
      loading.destroy();

      if (reqs.length === 0) {
        this._tc(this.add.text(width / 2, cy + 60, 'No pending friend requests.', {
          fontSize: '13px', fontFamily: 'Arial', color: '#5a4a2a',
        }).setOrigin(0.5));
        return;
      }

      reqs.forEach((r, i) => {
        const y = cy + i * 72;
        this._drawRequestRow(r, cx, y, cw, width);
      });
    } catch {
      loading.setText('Could not load requests.');
    }
  }

  _drawRequestRow(req, x, y, w, screenW) {
    const name = req.requesterSessionId.slice(0, 14) + '...';

    const bg = this._tc(this.add.graphics());
    bg.fillStyle(0x0a0810, 0.8);
    bg.fillRoundedRect(x, y, w, 56, 8);
    bg.lineStyle(1, 0xc9941a, 0.4);
    bg.strokeRoundedRect(x, y, w, 56, 8);

    this._tc(this.add.text(x + 18, y + 10, 'Friend request from:', {
      fontSize: '9px', fontFamily: 'Arial', color: '#7a6a4a',
    }));
    this._tc(this.add.text(x + 18, y + 28, name, {
      fontSize: '12px', fontFamily: 'Arial', color: '#e8d5a3',
    }));

    const acceptBtn = this._tc(this.add.text(x + w - 80, y + 28, 'ACCEPT', {
      fontSize: '10px', fontFamily: 'Arial', color: '#44cc88',
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }));
    acceptBtn.on('pointerdown', async () => {
      await FriendsManager.acceptFriendRequest(this._sessionId, req.requesterSessionId);
      this._loadTab(1);
    });

    const declineBtn = this._tc(this.add.text(x + w - 10, y + 28, 'DECLINE', {
      fontSize: '10px', fontFamily: 'Arial', color: '#cc4422',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    declineBtn.on('pointerdown', async () => {
      await FriendsManager.declineFriendRequest(this._sessionId, req.requesterSessionId);
      this._loadTab(1);
    });
  }

  // ----------------------------------------------------------------
  // FIND TAB
  // ----------------------------------------------------------------
  _buildFindTab(width) {
    const cx = this._contentAreaX;
    const cy = this._contentAreaY;
    const cw = this._contentAreaW;

    this._tc(this.add.text(cx, cy + 10, 'Search by display name or ID:', {
      fontSize: '11px', fontFamily: 'Arial', color: '#7a6a4a',
    }));

    const searchBg = this._tc(this.add.graphics());
    searchBg.fillStyle(0x050310, 0.9);
    searchBg.fillRoundedRect(cx, cy + 34, cw - 110, 36, 6);
    searchBg.lineStyle(1.5, BORDER, 0.5);
    searchBg.strokeRoundedRect(cx, cy + 34, cw - 110, 36, 6);

    const placeholder = this._tc(this.add.text(cx + 12, cy + 52, 'Enter name or ID...', {
      fontSize: '12px', fontFamily: 'Arial', color: '#3a3030',
    }).setOrigin(0, 0.5));

    const searchBtnBg = this._tc(this.add.graphics());
    const drawSearchBtn = (h) => {
      searchBtnBg.clear();
      searchBtnBg.fillStyle(h ? 0x3a1f05 : 0x1a0f03, 0.95);
      searchBtnBg.fillRoundedRect(cx + cw - 100, cy + 34, 90, 36, 6);
      searchBtnBg.lineStyle(1.5, BORDER, h ? 1 : 0.7);
      searchBtnBg.strokeRoundedRect(cx + cw - 100, cy + 34, 90, 36, 6);
    };
    drawSearchBtn(false);

    this._tc(this.add.text(cx + cw - 55, cy + 52, 'SEARCH', {
      fontSize: '10px', fontFamily: 'Arial', color: '#e8d5a3', fontStyle: 'bold',
    }).setOrigin(0.5));

    const searchHit = this._tc(this.add.rectangle(cx + cw - 55, cy + 52, 90, 36, 0, 0)
      .setInteractive({ useHandCursor: true }));
    searchHit.on('pointerover', () => drawSearchBtn(true));
    searchHit.on('pointerout', () => drawSearchBtn(false));
    searchHit.on('pointerdown', async () => {
      const query = prompt('Search for a player by name or ID:');
      if (!query || query.trim().length < 2) return;
      placeholder.setText(query.trim());
      placeholder.setColor('#e8d5a3');
      await this._doSearch(query.trim(), cx, cy + 80, cw);
    });

    this._tc(this.add.text(cx, cy + 92, 'OR add by exact session ID:', {
      fontSize: '10px', fontFamily: 'Arial', color: '#5a4a2a',
    }));

    const addIdBtn = this._tc(this.add.text(cx, cy + 114, '+ Add by ID', {
      fontSize: '11px', fontFamily: 'Arial', color: '#c9941a',
    }).setInteractive({ useHandCursor: true }));
    addIdBtn.on('pointerdown', async () => {
      const id = prompt('Enter the exact session ID of your friend:');
      if (!id || id.trim().length < 10) return;
      try {
        await FriendsManager.sendFriendRequest(this._sessionId, id.trim());
        this._tc(this.add.text(cx, cy + 140, 'Friend request sent!', {
          fontSize: '11px', fontFamily: 'Arial', color: '#44cc88',
        }));
      } catch (e) {
        this._tc(this.add.text(cx, cy + 140, e.message || 'Failed to send request.', {
          fontSize: '11px', fontFamily: 'Arial', color: '#cc4422',
        }));
      }
    });
  }

  async _doSearch(query, x, y, w) {
    const existing = this._tabContent.filter(e => e._isSearchResult);
    existing.forEach(e => e.destroy());

    try {
      const byName = await FriendsManager.searchByDisplayName(query);
      const byId = await FriendsManager.searchBySessionId(query);

      const seen = new Set();
      const results = [...byName, ...byId].filter(r => {
        if (seen.has(r.session_id) || r.session_id === this._sessionId) return false;
        seen.add(r.session_id);
        return true;
      });

      if (results.length === 0) {
        const t = this._tc(this.add.text(x, y, 'No players found.', {
          fontSize: '12px', fontFamily: 'Arial', color: '#5a4a2a',
        }));
        t._isSearchResult = true;
        return;
      }

      results.slice(0, 5).forEach((r, i) => {
        const ry = y + i * 56;
        this._drawSearchResult(r, x, ry, w);
      });
    } catch {}
  }

  _drawSearchResult(r, x, y, w) {
    const cutoff = new Date(Date.now() - 30000).toISOString();
    const isOnline = r.last_seen && r.last_seen > cutoff;

    const bg = this._tc(this.add.graphics());
    bg._isSearchResult = true;
    bg.fillStyle(0x0a0810, 0.8);
    bg.fillRoundedRect(x, y, w, 48, 8);
    bg.lineStyle(1, 0x2a1a0a, 0.7);
    bg.strokeRoundedRect(x, y, w, 48, 8);

    this._tc(this.add.circle(x + 18, y + 24, 6, isOnline ? 0x44ff88 : 0x333333));

    const nameT = this._tc(this.add.text(x + 36, y + 14, r.display_name || 'Unknown', {
      fontSize: '13px', fontFamily: 'Arial', color: '#e8d5a3',
    }));
    nameT._isSearchResult = true;

    const idT = this._tc(this.add.text(x + 36, y + 32, r.session_id.slice(0, 16) + '...', {
      fontSize: '9px', fontFamily: 'Arial', color: '#5a4a2a',
    }));
    idT._isSearchResult = true;

    const addBtn = this._tc(this.add.text(x + w - 10, y + 24, 'ADD FRIEND', {
      fontSize: '9px', fontFamily: 'Arial', color: '#c9941a',
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }));
    addBtn._isSearchResult = true;
    addBtn.on('pointerover', () => addBtn.setColor('#f0c040'));
    addBtn.on('pointerout', () => addBtn.setColor('#c9941a'));
    addBtn.on('pointerdown', async () => {
      try {
        await FriendsManager.sendFriendRequest(this._sessionId, r.session_id);
        addBtn.setText('SENT!').setColor('#888888').removeInteractive();
      } catch (e) {
        addBtn.setText(e.message?.slice(0, 12) || 'Error').setColor('#cc4422');
      }
    });
  }

  _drawBackButton(width, height) {
    const back = this.add.text(width / 2, height * 0.93, '← BACK', {
      fontSize: '12px', fontFamily: 'Arial', color: '#5a4a2a', letterSpacing: 2,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover', () => back.setColor(GOLD));
    back.on('pointerout', () => back.setColor('#5a4a2a'));
    back.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start(this._fromScene);
      });
    });
  }
}
