import { io } from 'socket.io-client';

const getSampleRooms = (arr, len) => {
  let chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

export default class BreakoutRoom {
  breakoutSession;
  myBreakoutRoom;
  socket = null;

  constructor(callFrame, joinCall, socket, createToken, handleOn = null) {
    this.daily = callFrame;
    this.breakoutSession = null;
    this.myBreakoutRoom = null;
    this.joinCall = joinCall;
    this.createToken = createToken;
    this.socket = socket;
    this._initializeSocketEvents();
    if (handleOn) {
      this.handleOnBreakoutStarted = handleOn.onBreakoutStarted;
      this.handleOnBreakoutUpdated = handleOn.onBreakoutUpdated;
      this.handleOnBreakoutConcluded = handleOn.onBreakoutConcluded;
    }
  }

  _initializeSocketEvents = () => {
    this.socket.on('DAILY_BREAKOUT_STARTED', this.onBreakoutSessionStarted);
    this.socket.on('DAILY_BREAKOUT_UPDATED', this.onBreakoutSessionUpdated);
    this.socket.on('DAILY_BREAKOUT_CONCLUDED', this.onBreakoutSessionEnded);
    this.socket.on('DAILY_BREAKOUT_REQUEST', this.onBreakoutSessionRequest);
    this.socket.on('DAILY_BREAKOUT_SYNC', this.onBreakoutSessionSync);
  };

  _updateMyBreakoutRoom = breakoutSession => {
    if (
      (breakoutSession && Object.values(breakoutSession).length === 0) ||
      breakoutSession?.rooms?.length === 0
    ) {
      this.myBreakoutRoom = null;
    } else {
      const localUser = this.daily?.participants()?.local;
      this.myBreakoutRoom = breakoutSession.rooms.filter(room =>
        room?.participantIds?.includes(localUser?.user_id),
      )[0];
    }
  };

  _join = async (roomName, isBreakoutRoom) => {
    const token = await this.createToken(
      isBreakoutRoom
        ? this.breakoutSession.config.record_breakout_sessions
        : false,
      roomName,
    );
    if (this?.daily) await this?.daily?.destroy();
    await this.joinCall(roomName, token, isBreakoutRoom);
  };

  _sendToSocket = async (event, sessionObject) => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject,
        event,
      }),
    };

    const res = await fetch('/api/socket', options);
    const { status } = await res.json();
    return status;
  };

  _syncSession = breakoutSession => {
    this._updateMyBreakoutRoom(breakoutSession);
    this.breakoutSession = breakoutSession;
  };

  // public functions

  getBreakoutSession = () => {
    return this.breakoutSession;
  };

  getMyBreakoutRoom = () => {
    return this.myBreakoutRoom;
  };

  autoAssign = totalRooms => {
    const rooms = [];

    const participants = Object.values(this.daily?.participants());
    const r = getSampleRooms(
      participants,
      Math.ceil(participants.length / totalRooms),
    );
    Array.from({ length: totalRooms }, (_, i) => {
      rooms[i] = {
        name: `Breakout room ${i + 1}`,
        roomName: `${process.env.NEXT_PUBLIC_DAILY_ROOM_NAME}-${i + 1}`,
        created: new Date(),
        participants: r?.[i] || [],
        participantIds: (r?.[i] || []).map(p => p.user_id),
      };
    });
    return rooms;
  };

  startSession = properties => {
    let r = [];
    properties.rooms.map(room => {
      if (room?.participants?.length > 0) {
        r.push({
          ...room,
          participantIds: room?.participants?.map(p => p.user_id) || [],
        });
      }
    });

    this.breakoutSession = {
      rooms: r,
      config: properties.config,
    };

    this._updateMyBreakoutRoom(this.breakoutSession);
    this._sendToSocket('DAILY_BREAKOUT_STARTED', this.breakoutSession);

    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  };

  updateSession = breakoutSession => {
    this.breakoutSession = breakoutSession;
    this._updateMyBreakoutRoom(this.breakoutSession);

    this._sendToSocket('DAILY_BREAKOUT_UPDATED', this.breakoutSession);

    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  };

  endSession = () => {
    this.breakoutSession = {};
    this._updateMyBreakoutRoom(this.breakoutSession);

    this._sendToSocket('DAILY_BREAKOUT_CONCLUDED', null);

    return this.breakoutSession;
  };

  assignRoomToNewParticipant = (participant, roomIndex = null) => {
    const r = this.breakoutSession?.rooms;
    if (!r) return;

    if (roomIndex) {
      const room = r[roomIndex];
      room.participants.push(participant);
      room.participantIds?.push(participant.user_id);
      r[roomIndex] = room;
    } else {
      const participantsInRooms = r.map(room => room.participants.length);
      const minParticipantRoomIndex = participantsInRooms.indexOf(
        Math.min(...participantsInRooms),
      );
      const room = r[minParticipantRoomIndex];
      room.participants.push(participant);
      room.participantIds?.push(participant.user_id);
      r[minParticipantRoomIndex] = room;
    }

    this.breakoutSession.rooms = r;
    this._updateMyBreakoutRoom(this.breakoutSession);

    this._sendToSocket('DAILY_BREAKOUT_UPDATED', this.breakoutSession);

    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  };

  // Breakout session handlers
  onBreakoutSessionStarted = async data => {
    if (this.handleOnBreakoutStarted)
      this?.handleOnBreakoutStarted(data.sessionObject, this.myBreakoutRoom);

    this._syncSession(data.sessionObject);
    if (!this.myBreakoutRoom?.roomName) return;

    await this._join(this.myBreakoutRoom.roomName, true);
  };

  onBreakoutSessionUpdated = async data => {
    if (this.handleOnBreakoutUpdated)
      this?.handleOnBreakoutUpdated(data.sessionObject, this.myBreakoutRoom);

    this._syncSession(data.sessionObject);
    const room = await this.daily?.room();

    if (this.getMyBreakoutRoom()?.roomName !== room?.name) {
      await this._join(this.myBreakoutRoom.roomName, true);
    }
  };

  onBreakoutSessionEnded = () => {
    if (this.handleOnBreakoutConcluded) this?.handleOnBreakoutConcluded();
    this._syncSession(null);
    this._join(null, false);
  };

  onBreakoutSessionRequest = () => {
    if (this.breakoutSession && this.daily) {
      this._sendToSocket('DAILY_BREAKOUT_SYNC', this.breakoutSession);
    }
  };

  onBreakoutSessionSync = data => {
    this._syncSession(data.sessionObject);
  };
}
