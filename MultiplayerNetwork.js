import { supabase } from './supabase.js';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const MultiplayerNetwork = {
  _roomSubscription: null,
  _commandSubscription: null,
  _heartbeatTimer: null,

  async createRoom(sessionId, displayName, faction, matchType = 'friend_code') {
    let roomCode;
    let attempts = 0;
    while (attempts < 10) {
      roomCode = generateRoomCode();
      const { data: existing } = await supabase
        .from('mp_rooms')
        .select('room_code')
        .eq('room_code', roomCode)
        .maybeSingle();
      if (!existing) break;
      attempts++;
    }

    const { data, error } = await supabase
      .from('mp_rooms')
      .insert({
        room_code: roomCode,
        host_session_id: sessionId,
        host_display_name: displayName,
        host_faction: faction,
        status: 'lobby',
        match_type: matchType,
        last_activity: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) throw new Error('Failed to create room: ' + error.message);
    return data;
  },

  async joinRoom(roomCode, sessionId, displayName, faction) {
    const { data: room, error: fetchError } = await supabase
      .from('mp_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .eq('status', 'lobby')
      .maybeSingle();

    if (fetchError) throw new Error('Failed to find room: ' + fetchError.message);
    if (!room) throw new Error('Room not found or already started');
    if (room.host_session_id === sessionId) throw new Error('Cannot join your own room');

    const { data, error } = await supabase
      .from('mp_rooms')
      .update({
        guest_session_id: sessionId,
        guest_display_name: displayName,
        guest_faction: faction,
        status: 'countdown',
        last_activity: new Date().toISOString(),
      })
      .eq('room_code', roomCode.toUpperCase())
      .select()
      .maybeSingle();

    if (error) throw new Error('Failed to join room: ' + error.message);
    return data;
  },

  async findRandomRoom(sessionId, displayName, faction) {
    const { data: rooms } = await supabase
      .from('mp_rooms')
      .select('*')
      .eq('status', 'lobby')
      .eq('match_type', 'random')
      .neq('host_session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(5);

    if (rooms && rooms.length > 0) {
      try {
        return await this.joinRoom(rooms[0].room_code, sessionId, displayName, faction);
      } catch {
        // Room may have been taken; fall through to create
      }
    }

    return await this.createRoom(sessionId, displayName, faction, 'random');
  },

  async getRoomByCode(roomCode) {
    const { data, error } = await supabase
      .from('mp_rooms')
      .select('*')
      .eq('room_code', roomCode.toUpperCase())
      .maybeSingle();
    if (error) return null;
    return data;
  },

  subscribeToRoom(roomCode, callback) {
    if (this._roomSubscription) {
      supabase.removeChannel(this._roomSubscription);
    }
    this._roomSubscription = supabase
      .channel(`room:${roomCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mp_rooms',
        filter: `room_code=eq.${roomCode}`,
      }, (payload) => callback(payload.new || payload.old))
      .subscribe();
    return this._roomSubscription;
  },

  async submitCommands(roomCode, playerRole, turn, commands) {
    const { error } = await supabase
      .from('mp_commands')
      .insert({
        room_code: roomCode,
        turn,
        player_role: playerRole,
        commands_json: commands,
        submitted_at: new Date().toISOString(),
      });
    if (error) throw new Error('Failed to submit commands: ' + error.message);
  },

  subscribeToCommands(roomCode, callback) {
    if (this._commandSubscription) {
      supabase.removeChannel(this._commandSubscription);
    }
    this._commandSubscription = supabase
      .channel(`commands:${roomCode}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mp_commands',
        filter: `room_code=eq.${roomCode}`,
      }, (payload) => callback(payload.new))
      .subscribe();
    return this._commandSubscription;
  },

  async getTurnCommands(roomCode, turn) {
    const { data, error } = await supabase
      .from('mp_commands')
      .select('*')
      .eq('room_code', roomCode)
      .eq('turn', turn);
    if (error) return [];
    return data || [];
  },

  async sendHeartbeat(roomCode) {
    await supabase
      .from('mp_rooms')
      .update({ last_activity: new Date().toISOString() })
      .eq('room_code', roomCode);
  },

  startHeartbeat(roomCode) {
    this.stopHeartbeat();
    this._heartbeatTimer = setInterval(() => {
      this.sendHeartbeat(roomCode);
    }, 5000);
  },

  stopHeartbeat() {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  },

  async leaveRoom(roomCode, playerRole, sessionId) {
    const room = await this.getRoomByCode(roomCode);
    if (!room) return;

    if (room.status === 'finished' || room.status === 'abandoned') return;

    await supabase
      .from('mp_rooms')
      .update({ status: 'abandoned', last_activity: new Date().toISOString() })
      .eq('room_code', roomCode);

    const winnerId = playerRole === 'host' ? room.guest_session_id : room.host_session_id;
    if (winnerId) {
      await supabase.from('mp_results').insert({
        room_code: roomCode,
        winner_session_id: winnerId,
        loser_session_id: sessionId,
        host_faction: room.host_faction || 'roman',
        guest_faction: room.guest_faction || 'roman',
        turns_played: 0,
        forfeit: true,
      });
    }
  },

  async updateRoomStatus(roomCode, status) {
    await supabase
      .from('mp_rooms')
      .update({ status, last_activity: new Date().toISOString() })
      .eq('room_code', roomCode);
  },

  async saveResult(roomCode, winnerSessionId, loserSessionId, hostFaction, guestFaction, turnsPlayed) {
    await supabase.from('mp_results').insert({
      room_code: roomCode,
      winner_session_id: winnerSessionId,
      loser_session_id: loserSessionId,
      host_faction: hostFaction,
      guest_faction: guestFaction,
      turns_played: turnsPlayed,
      forfeit: false,
    });
    await supabase
      .from('mp_rooms')
      .update({ status: 'finished' })
      .eq('room_code', roomCode);
  },

  unsubscribeAll() {
    this.stopHeartbeat();
    if (this._roomSubscription) {
      supabase.removeChannel(this._roomSubscription);
      this._roomSubscription = null;
    }
    if (this._commandSubscription) {
      supabase.removeChannel(this._commandSubscription);
      this._commandSubscription = null;
    }
  },
};
