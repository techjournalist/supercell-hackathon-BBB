import Phaser from 'phaser';
import { ProfileManager } from './ProfileManager.js';
import { MusicManager } from './MusicManager.js';
import { soundEffects } from './SoundEffectsManager.js';

const GOLD = 0xc9941a;
const GOLD_STR = '#c9941a';
const GOLD_BRIGHT = '#f0c040';
const DARK_BG = 0x0a050f;
const PANEL_BORDER = 0xc9941a;
const SLOT_W = 220;
const SLOT_H = 260;
const SLOT_GAP = 24;
const ICONS = ['sword', 'shield', 'skull'];

export class ProfileSelectScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ProfileSelectScene' });
  }

  init(data) {
    this._fromMenu = data && data.fromMenu === true;
  }

  create() {
    const { width, height } = this.scale;

    this._drawBackground(width, height);
    this._drawTitle(width, height);
    this._drawSlots(width, height);
    this._drawFooter(width, height);
  }

  _drawBackground(width, height) {
    const bg = this.add.rectangle(0, 0, width, height, 0x0d0710);
    bg.setOrigin(0);

    const grad = this.add.graphics();
    grad.fillGradientStyle(0x1a0e04, 0x1a0e04, 0x0d0710, 0x0d0710, 0.9, 0.9, 1, 1);
    grad.fillRect(0, 0, width, height / 2);

    for (let i = 0; i < 40; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const alpha = Phaser.Math.FloatBetween(0.15, 0.5);
      const r = Phaser.Math.FloatBetween(1, 2);
      const star = this.add.circle(x, y, r, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(1200, 3000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  _drawTitle(width, height) {
    const titleY = height * 0.13;

    const titleShadow = this.add.text(width / 2 + 2, titleY + 2, 'SELECT PROFILE', {
      fontSize: `${Math.max(18, Math.min(width * 0.035, 36))}px`,
      fontFamily: 'Press Start 2P, Arial',
      color: '#3a1a00',
    });
    titleShadow.setOrigin(0.5);

    const title = this.add.text(width / 2, titleY, 'SELECT PROFILE', {
      fontSize: `${Math.max(18, Math.min(width * 0.035, 36))}px`,
      fontFamily: 'Press Start 2P, Arial',
      color: '#e8d5a3',
    });
    title.setOrigin(0.5);

    const sub = this.add.text(width / 2, titleY + 52, 'Up to 3 commanders can share this device', {
      fontSize: `${Math.max(10, Math.min(width * 0.013, 14))}px`,
      fontFamily: 'Arial, sans-serif',
      color: '#8a7a5a',
      letterSpacing: 1,
    });
    sub.setOrigin(0.5);
  }

  _drawSlots(width, height) {
    const profiles = ProfileManager.getAll();
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.slot] = p; });

    const totalW = (SLOT_W * 3) + (SLOT_GAP * 2);
    const startX = width / 2 - totalW / 2;
    const slotY = height * 0.5 - SLOT_H / 2;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * (SLOT_W + SLOT_GAP);
      const profile = profileMap[i] || null;
      this._drawSlot(x, slotY, i, profile, width, height);
    }
  }

  _drawSlot(x, y, slot, profile, screenW, screenH) {
    const isEmpty = !profile;

    const card = this.add.graphics();
    const borderAlpha = isEmpty ? 0.3 : 0.8;
    const fillColor = isEmpty ? 0x080508 : 0x100a18;

    card.fillStyle(fillColor, 0.95);
    card.fillRoundedRect(x, y, SLOT_W, SLOT_H, 12);
    card.lineStyle(isEmpty ? 1 : 2, PANEL_BORDER, borderAlpha);
    card.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 12);

    const hitZone = this.add.rectangle(x + SLOT_W / 2, y + SLOT_H / 2, SLOT_W, SLOT_H, 0x000000, 0);
    hitZone.setInteractive({ useHandCursor: true });

    if (isEmpty) {
      this._drawEmptySlot(x, y, slot, card, hitZone, screenW, screenH);
    } else {
      this._drawFilledSlot(x, y, slot, profile, card, hitZone, screenW, screenH);
    }
  }

  _drawEmptySlot(x, y, slot, card, hitZone, screenW, screenH) {
    const cx = x + SLOT_W / 2;
    const cy = y + SLOT_H / 2;

    const plus = this.add.text(cx, cy - 20, '+', {
      fontSize: '48px',
      fontFamily: 'Arial, sans-serif',
      color: '#3a2a10',
    });
    plus.setOrigin(0.5);

    const label = this.add.text(cx, cy + 30, 'NEW PROFILE', {
      fontSize: '10px',
      fontFamily: 'Arial, sans-serif',
      color: '#4a3a1a',
      letterSpacing: 2,
    });
    label.setOrigin(0.5);

    hitZone.on('pointerover', () => {
      card.clear();
      card.fillStyle(0x1a1010, 0.95);
      card.fillRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      card.lineStyle(2, GOLD, 0.5);
      card.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      plus.setColor('#c9941a');
      label.setColor('#c9941a');
      soundEffects.playButtonHover && soundEffects.playButtonHover();
    });

    hitZone.on('pointerout', () => {
      card.clear();
      card.fillStyle(0x080508, 0.95);
      card.fillRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      card.lineStyle(1, PANEL_BORDER, 0.3);
      card.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      plus.setColor('#3a2a10');
      label.setColor('#4a3a1a');
    });

    hitZone.on('pointerdown', () => {
      soundEffects.playButtonClick && soundEffects.playButtonClick();
      this._showCreateDialog(slot);
    });
  }

  _drawFilledSlot(x, y, slot, profile, card, hitZone, screenW, screenH) {
    const cx = x + SLOT_W / 2;

    const iconChar = ProfileManager.getIconChar(profile.icon);
    const iconText = this.add.text(cx, y + 52, iconChar, {
      fontSize: '40px',
    });
    iconText.setOrigin(0.5);

    const nameText = this.add.text(cx, y + 108, profile.name.toUpperCase(), {
      fontSize: '11px',
      fontFamily: 'Press Start 2P, Arial',
      color: '#e8d5a3',
      wordWrap: { width: SLOT_W - 20 },
      align: 'center',
    });
    nameText.setOrigin(0.5);

    const wins = profile.totalWins || 0;
    const games = profile.totalGames || 0;
    const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;

    const statsText = this.add.text(cx, y + 148, `${games} games  ${winRate}% wins`, {
      fontSize: '9px',
      fontFamily: 'Arial, sans-serif',
      color: '#8a7a5a',
      letterSpacing: 1,
    });
    statsText.setOrigin(0.5);

    const lastPlayed = this._formatDate(profile.lastPlayed);
    const lastText = this.add.text(cx, y + 168, `Last: ${lastPlayed}`, {
      fontSize: '9px',
      fontFamily: 'Arial, sans-serif',
      color: '#5a4a2a',
    });
    lastText.setOrigin(0.5);

    const playBtn = this._makeSmallButton(cx - 44, y + SLOT_H - 44, 80, 28, 'PLAY', GOLD_STR, 0x1a0f03, GOLD);
    const deleteBtn = this._makeSmallButton(cx + 44, y + SLOT_H - 44, 60, 28, 'DEL', '#884422', 0x1a0505, 0x884422);

    hitZone.on('pointerover', () => {
      card.clear();
      card.fillStyle(0x18100a, 0.95);
      card.fillRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      card.lineStyle(2, 0xf0c040, 1);
      card.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      card.lineStyle(8, GOLD, 0.2);
      card.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      soundEffects.playButtonHover && soundEffects.playButtonHover();
    });

    hitZone.on('pointerout', () => {
      card.clear();
      card.fillStyle(0x100a18, 0.95);
      card.fillRoundedRect(x, y, SLOT_W, SLOT_H, 12);
      card.lineStyle(2, PANEL_BORDER, 0.8);
      card.strokeRoundedRect(x, y, SLOT_W, SLOT_H, 12);
    });

    playBtn.hitZone.on('pointerdown', () => {
      soundEffects.playButtonClick && soundEffects.playButtonClick();
      ProfileManager.setActive(slot);
      this._goToMenu();
    });

    deleteBtn.hitZone.on('pointerdown', () => {
      soundEffects.playButtonClick && soundEffects.playButtonClick();
      this._confirmDelete(slot, profile.name);
    });
  }

  _makeSmallButton(cx, cy, w, h, label, textColor, fillColor, borderColor) {
    const bg = this.add.graphics();
    bg.fillStyle(fillColor, 0.9);
    bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
    bg.lineStyle(1, borderColor, 1);
    bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);

    const txt = this.add.text(cx, cy, label, {
      fontSize: '9px',
      fontFamily: 'Arial, sans-serif',
      color: textColor,
      fontStyle: 'bold',
      letterSpacing: 1,
    });
    txt.setOrigin(0.5);

    const hitZone = this.add.rectangle(cx, cy, w, h, 0x000000, 0);
    hitZone.setInteractive({ useHandCursor: true });

    hitZone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(borderColor, 0.25);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
      bg.lineStyle(1, borderColor, 1);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
    });
    hitZone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(fillColor, 0.9);
      bg.fillRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
      bg.lineStyle(1, borderColor, 1);
      bg.strokeRoundedRect(cx - w / 2, cy - h / 2, w, h, 4);
    });

    return { bg, txt, hitZone };
  }

  _drawFooter(width, height) {
    const backText = this.add.text(width / 2, height * 0.9, '← BACK TO MENU', {
      fontSize: '11px',
      fontFamily: 'Arial, sans-serif',
      color: '#5a4a2a',
      letterSpacing: 2,
    });
    backText.setOrigin(0.5);
    backText.setInteractive({ useHandCursor: true });
    backText.on('pointerover', () => backText.setColor(GOLD_STR));
    backText.on('pointerout', () => backText.setColor('#5a4a2a'));
    backText.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });

    this.input.keyboard.on('keydown-ESC', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    });
  }

  _showCreateDialog(slot) {
    const { width, height } = this.scale;
    const elements = [];

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75);
    overlay.setOrigin(0);
    overlay.setDepth(500);
    elements.push(overlay);

    const dw = Math.min(420, width * 0.9);
    const dh = 280;
    const dialog = this.add.graphics();
    dialog.setDepth(501);
    dialog.fillStyle(0x0d0810, 1);
    dialog.fillRoundedRect(width / 2 - dw / 2, height / 2 - dh / 2, dw, dh, 12);
    dialog.lineStyle(2, GOLD, 0.9);
    dialog.strokeRoundedRect(width / 2 - dw / 2, height / 2 - dh / 2, dw, dh, 12);
    elements.push(dialog);

    const title = this.add.text(width / 2, height / 2 - dh / 2 + 36, 'NEW COMMANDER', {
      fontSize: '14px',
      fontFamily: 'Press Start 2P, Arial',
      color: '#e8d5a3',
    });
    title.setOrigin(0.5);
    title.setDepth(502);
    elements.push(title);

    const sub = this.add.text(width / 2, height / 2 - dh / 2 + 68, 'Choose your icon and name', {
      fontSize: '11px',
      fontFamily: 'Arial',
      color: '#8a7a5a',
    });
    sub.setOrigin(0.5);
    sub.setDepth(502);
    elements.push(sub);

    let selectedIcon = ICONS[slot] || 'sword';
    const iconChars = ICONS.map(i => ProfileManager.getIconChar(i));
    const iconTexts = [];
    const iconBgs = [];

    ICONS.forEach((icon, idx) => {
      const ix = width / 2 - 44 + idx * 44;
      const iy = height / 2 - 20;

      const ibg = this.add.graphics();
      ibg.setDepth(502);
      elements.push(ibg);

      const drawIconBg = (active) => {
        ibg.clear();
        ibg.fillStyle(active ? 0x2a1a06 : 0x100808, 0.9);
        ibg.fillRoundedRect(ix - 18, iy - 18, 36, 36, 6);
        ibg.lineStyle(1.5, active ? GOLD : 0x3a2a10, active ? 1 : 0.5);
        ibg.strokeRoundedRect(ix - 18, iy - 18, 36, 36, 6);
      };
      drawIconBg(icon === selectedIcon);
      iconBgs.push({ draw: drawIconBg });

      const it = this.add.text(ix, iy, iconChars[idx], { fontSize: '22px' });
      it.setOrigin(0.5);
      it.setDepth(503);
      elements.push(it);
      iconTexts.push(it);

      const iHit = this.add.rectangle(ix, iy, 36, 36, 0, 0);
      iHit.setInteractive({ useHandCursor: true });
      iHit.setDepth(504);
      elements.push(iHit);

      iHit.on('pointerdown', () => {
        selectedIcon = icon;
        iconBgs.forEach((bg, i) => bg.draw(ICONS[i] === selectedIcon));
      });
    });

    const confirmBtn = this.add.graphics();
    confirmBtn.setDepth(502);
    elements.push(confirmBtn);

    const drawConfirm = (hover) => {
      confirmBtn.clear();
      confirmBtn.fillStyle(hover ? 0x3a1f05 : 0x1a0f03, 0.95);
      confirmBtn.fillRoundedRect(width / 2 - 70, height / 2 + dh / 2 - 60, 140, 36, 6);
      confirmBtn.lineStyle(1.5, GOLD, hover ? 1 : 0.8);
      confirmBtn.strokeRoundedRect(width / 2 - 70, height / 2 + dh / 2 - 60, 140, 36, 6);
    };
    drawConfirm(false);

    const confirmText = this.add.text(width / 2, height / 2 + dh / 2 - 42, 'CREATE', {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#e8d5a3',
      fontStyle: 'bold',
      letterSpacing: 2,
    });
    confirmText.setOrigin(0.5);
    confirmText.setDepth(503);
    elements.push(confirmText);

    const confirmHit = this.add.rectangle(width / 2, height / 2 + dh / 2 - 42, 140, 36, 0, 0);
    confirmHit.setInteractive({ useHandCursor: true });
    confirmHit.setDepth(504);
    elements.push(confirmHit);

    confirmHit.on('pointerover', () => drawConfirm(true));
    confirmHit.on('pointerout', () => drawConfirm(false));
    confirmHit.on('pointerdown', () => {
      elements.forEach(e => e.destroy());
      const raw = prompt('Enter commander name (max 12 characters):', `Commander ${slot + 1}`);
      const name = raw && raw.trim() ? raw.trim().substring(0, 12) : `Commander ${slot + 1}`;
      const profile = ProfileManager.create(name, selectedIcon);
      if (profile) {
        this._goToMenu();
      }
    });

    overlay.setInteractive();
    overlay.on('pointerdown', () => elements.forEach(e => e.destroy()));
  }

  _confirmDelete(slot, name) {
    const { width, height } = this.scale;
    const elements = [];

    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.75);
    overlay.setOrigin(0);
    overlay.setDepth(500);
    elements.push(overlay);

    const dw = Math.min(380, width * 0.9);
    const dh = 200;
    const dialog = this.add.graphics();
    dialog.setDepth(501);
    dialog.fillStyle(0x0d0810, 1);
    dialog.fillRoundedRect(width / 2 - dw / 2, height / 2 - dh / 2, dw, dh, 12);
    dialog.lineStyle(2, 0xaa3322, 0.9);
    dialog.strokeRoundedRect(width / 2 - dw / 2, height / 2 - dh / 2, dw, dh, 12);
    elements.push(dialog);

    const msg = this.add.text(width / 2, height / 2 - 40, `Delete "${name}"?\nAll progress will be lost.`, {
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      color: '#e8d5a3',
      align: 'center',
      lineSpacing: 6,
    });
    msg.setOrigin(0.5);
    msg.setDepth(502);
    elements.push(msg);

    const yesBtn = this._makeSmallButton(width / 2 - 54, height / 2 + 44, 90, 34, 'DELETE', '#cc4433', 0x1a0505, 0xaa3322);
    const noBtn = this._makeSmallButton(width / 2 + 54, height / 2 + 44, 90, 34, 'CANCEL', GOLD_STR, 0x1a0f03, GOLD);

    [yesBtn.bg, yesBtn.txt, yesBtn.hitZone, noBtn.bg, noBtn.txt, noBtn.hitZone].forEach(e => {
      e.setDepth(502);
      elements.push(e);
    });

    yesBtn.hitZone.on('pointerdown', () => {
      elements.forEach(e => e.destroy());
      ProfileManager.delete(slot);
      this.scene.restart();
    });

    noBtn.hitZone.on('pointerdown', () => {
      elements.forEach(e => e.destroy());
    });
  }

  _goToMenu() {
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }

  _formatDate(ts) {
    if (!ts) return 'Never';
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
}
