import { supabase } from './supabase.js';

const PRESENCE_INTERVAL = 15000;

let _presenceTimer = null;
let _presenceSubscription = null;
let _friendsSubscription = null;

export const FriendsManager = {
  async sendFriendRequest(mySessionId, targetSessionId) {
    if (mySessionId === targetSessionId) throw new Error('Cannot add yourself');

    const { data: existing } = await supabase
      .from('friends')
      .select('id, status')
      .or(
        `and(requester_session_id.eq.${mySessionId},target_session_id.eq.${targetSessionId}),` +
        `and(requester_session_id.eq.${targetSessionId},target_session_id.eq.${mySessionId})`
      )
      .maybeSingle();

    if (existing) {
      if (existing.status === 'accepted') throw new Error('Already friends');
      if (existing.status === 'pending') throw new Error('Request already pending');
    }

    const { error } = await supabase.from('friends').insert({
      requester_session_id: mySessionId,
      target_session_id: targetSessionId,
      status: 'pending',
    });
    if (error) throw new Error('Failed to send request: ' + error.message);
  },

  async acceptFriendRequest(mySessionId, requesterSessionId) {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('requester_session_id', requesterSessionId)
      .eq('target_session_id', mySessionId)
      .eq('status', 'pending');
    if (error) throw new Error('Failed to accept request: ' + error.message);
  },

  async declineFriendRequest(mySessionId, requesterSessionId) {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('requester_session_id', requesterSessionId)
      .eq('target_session_id', mySessionId)
      .eq('status', 'pending');
    if (error) throw new Error('Failed to decline request: ' + error.message);
  },

  async removeFriend(mySessionId, friendSessionId) {
    await supabase
      .from('friends')
      .delete()
      .or(
        `and(requester_session_id.eq.${mySessionId},target_session_id.eq.${friendSessionId}),` +
        `and(requester_session_id.eq.${friendSessionId},target_session_id.eq.${mySessionId})`
      );
  },

  async getFriends(sessionId) {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .or(`requester_session_id.eq.${sessionId},target_session_id.eq.${sessionId}`)
      .eq('status', 'accepted');
    if (error) return [];
    return (data || []).map(row => ({
      id: row.id,
      sessionId: row.requester_session_id === sessionId
        ? row.target_session_id
        : row.requester_session_id,
      since: row.updated_at,
    }));
  },

  async getPendingRequests(sessionId) {
    const { data, error } = await supabase
      .from('friends')
      .select('*')
      .eq('target_session_id', sessionId)
      .eq('status', 'pending');
    if (error) return [];
    return (data || []).map(row => ({
      id: row.id,
      requesterSessionId: row.requester_session_id,
      createdAt: row.created_at,
    }));
  },

  async getOnlineFriends(sessionId) {
    const friends = await this.getFriends(sessionId);
    if (friends.length === 0) return [];

    const friendIds = friends.map(f => f.sessionId);
    const cutoff = new Date(Date.now() - 30000).toISOString();

    const { data: presence } = await supabase
      .from('online_presence')
      .select('*')
      .in('session_id', friendIds)
      .gte('last_seen', cutoff);

    const presenceMap = {};
    (presence || []).forEach(p => { presenceMap[p.session_id] = p; });

    return friends.map(f => ({
      ...f,
      presence: presenceMap[f.sessionId] || null,
      isOnline: !!presenceMap[f.sessionId],
    }));
  },

  async searchBySessionId(partialId) {
    if (!partialId || partialId.length < 6) return [];
    const { data } = await supabase
      .from('online_presence')
      .select('session_id, display_name, status, last_seen')
      .ilike('session_id', `${partialId}%`)
      .limit(10);
    return data || [];
  },

  async searchByDisplayName(name) {
    if (!name || name.length < 2) return [];
    const { data } = await supabase
      .from('online_presence')
      .select('session_id, display_name, status, last_seen')
      .ilike('display_name', `%${name}%`)
      .limit(10);
    return data || [];
  },

  async updatePresence(sessionId, displayName, status = 'online', roomCode = null) {
    await supabase
      .from('online_presence')
      .upsert({
        session_id: sessionId,
        display_name: displayName,
        status,
        current_room_code: roomCode,
        last_seen: new Date().toISOString(),
      }, { onConflict: 'session_id' });
  },

  startPresenceHeartbeat(sessionId, displayName, getStatus) {
    this.stopPresenceHeartbeat();
    const tick = () => {
      const { status, roomCode } = getStatus ? getStatus() : { status: 'online', roomCode: null };
      this.updatePresence(sessionId, displayName, status, roomCode);
    };
    tick();
    _presenceTimer = setInterval(tick, PRESENCE_INTERVAL);
  },

  stopPresenceHeartbeat() {
    if (_presenceTimer) {
      clearInterval(_presenceTimer);
      _presenceTimer = null;
    }
  },

  async setOffline(sessionId) {
    this.stopPresenceHeartbeat();
    await supabase
      .from('online_presence')
      .update({ status: 'offline', last_seen: new Date().toISOString() })
      .eq('session_id', sessionId);
  },

  subscribeFriendsChanges(sessionId, callback) {
    if (_friendsSubscription) {
      supabase.removeChannel(_friendsSubscription);
    }
    _friendsSubscription = supabase
      .channel(`friends:${sessionId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends',
        filter: `target_session_id=eq.${sessionId}`,
      }, callback)
      .subscribe();
    return _friendsSubscription;
  },

  subscribePresenceChanges(sessionIds, callback) {
    if (_presenceSubscription) {
      supabase.removeChannel(_presenceSubscription);
    }
    _presenceSubscription = supabase
      .channel('presence_watch')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'online_presence',
      }, (payload) => {
        if (sessionIds.includes(payload.new?.session_id)) {
          callback(payload.new);
        }
      })
      .subscribe();
    return _presenceSubscription;
  },

  unsubscribeAll() {
    this.stopPresenceHeartbeat();
    if (_friendsSubscription) {
      supabase.removeChannel(_friendsSubscription);
      _friendsSubscription = null;
    }
    if (_presenceSubscription) {
      supabase.removeChannel(_presenceSubscription);
      _presenceSubscription = null;
    }
  },
};
