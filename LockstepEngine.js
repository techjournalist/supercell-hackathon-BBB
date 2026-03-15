import { MultiplayerNetwork } from './MultiplayerNetwork.js';

const TURN_DURATION_MS = 200;
const TIMEOUT_MS = 8000;

export class LockstepEngine {
  constructor(roomCode, playerRole) {
    this.roomCode = roomCode;
    this.playerRole = playerRole;
    this.opponentRole = playerRole === 'host' ? 'guest' : 'host';

    this.currentTurn = 0;
    this.isRunning = false;
    this.isPaused = false;

    this._localCommands = [];
    this._pendingTurns = {};
    this._turnTimer = null;
    this._waitingStart = null;

    this.onTurnReady = null;
    this.onWaiting = null;
    this.onResumed = null;
    this.onOpponentDisconnect = null;
  }

  start() {
    this.isRunning = true;
    this.isPaused = false;
    this.currentTurn = 0;

    MultiplayerNetwork.subscribeToCommands(this.roomCode, (row) => {
      this._onCommandReceived(row);
    });

    this._scheduleTurnEnd();
  }

  queueCommand(command) {
    if (!this.isRunning) return;
    this._localCommands.push(command);
  }

  _scheduleTurnEnd() {
    if (!this.isRunning) return;
    this._turnTimer = setTimeout(() => {
      this._endTurn();
    }, TURN_DURATION_MS);
  }

  async _endTurn() {
    if (!this.isRunning) return;

    const turn = this.currentTurn;
    const commands = [...this._localCommands];
    this._localCommands = [];

    this._pendingTurns[turn] = this._pendingTurns[turn] || {};
    this._pendingTurns[turn][this.playerRole] = commands;

    try {
      await MultiplayerNetwork.submitCommands(this.roomCode, this.playerRole, turn, commands);
    } catch (e) {
      console.warn('LockstepEngine: failed to submit commands for turn', turn, e);
    }

    this._tryAdvanceTurn(turn);
  }

  _onCommandReceived(row) {
    const { turn, player_role, commands_json } = row;

    this._pendingTurns[turn] = this._pendingTurns[turn] || {};
    this._pendingTurns[turn][player_role] = commands_json || [];

    this._tryAdvanceTurn(turn);
  }

  _tryAdvanceTurn(turn) {
    if (turn !== this.currentTurn) return;

    const bucket = this._pendingTurns[turn];
    if (!bucket) return;

    const hasOwn = bucket[this.playerRole] !== undefined;
    const hasOpponent = bucket[this.opponentRole] !== undefined;

    if (!hasOwn) return;

    if (!hasOpponent) {
      if (!this.isPaused) {
        this.isPaused = true;
        this._waitingStart = Date.now();
        if (this.onWaiting) this.onWaiting(turn);
      }

      const elapsed = Date.now() - (this._waitingStart || Date.now());
      if (elapsed > TIMEOUT_MS) {
        if (this.onOpponentDisconnect) this.onOpponentDisconnect();
        this.stop();
      }
      return;
    }

    if (this.isPaused) {
      this.isPaused = false;
      this._waitingStart = null;
      if (this.onResumed) this.onResumed();
    }

    const hostCmds = bucket['host'] || [];
    const guestCmds = bucket['guest'] || [];

    delete this._pendingTurns[turn];
    this.currentTurn++;

    if (this.onTurnReady) {
      this.onTurnReady(turn, hostCmds, guestCmds);
    }

    this._scheduleTurnEnd();
  }

  stop() {
    this.isRunning = false;
    if (this._turnTimer) {
      clearTimeout(this._turnTimer);
      this._turnTimer = null;
    }
  }

  getTurnCount() {
    return this.currentTurn;
  }
}
