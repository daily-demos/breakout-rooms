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

  constructor(callFrame, joinCall, createToken, roomName) {
    this.daily = callFrame;
    this.breakoutSession = {};
    this.myBreakoutRoom = null;
    this.joinCall = joinCall;
    this.createToken = createToken;
    this.roomName = roomName;
  }

  // Prefixed with `#` to make it private function.
  #updateMyBreakoutRoom(breakoutSession) {
    if (
      Object.keys(breakoutSession).length === 0 ||
      breakoutSession?.rooms?.length === 0
    ) {
      this.myBreakoutRoom = null;
    } else {
      const localUser = this.daily?.participants()?.local;
      this.myBreakoutRoom = breakoutSession.rooms.filter(room =>
        room?.participantIds?.includes(localUser?.user_id),
      )[0];
    }
  }

  // public functions
  getMyBreakoutRoom() {
    return this.myBreakoutRoom;
  }

  sync(breakoutSession) {
    this.#updateMyBreakoutRoom(breakoutSession);
    this.breakoutSession = breakoutSession;
  }

  autoAssign(totalRooms) {
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
  }

  startSession(properties) {
    console.log('Starting breakout session');

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

    this.#updateMyBreakoutRoom(this.breakoutSession);

    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  }

  updateSession(breakoutSession) {
    this.breakoutSession = breakoutSession;
    this.#updateMyBreakoutRoom(this.breakoutSession);
    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  }

  endSession() {
    this.breakoutSession = {};
    this.#updateMyBreakoutRoom(this.breakoutSession);
    return this.breakoutSession;
  }

  assignRoomToNewParticipant(participant, roomIndex = null) {
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
    this.#updateMyBreakoutRoom(this.breakoutSession);

    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  }

  async #join(roomName, isBreakoutRoom) {
    const token = await this.createToken(
      isBreakoutRoom
        ? this.breakoutSession.config.record_breakout_sessions
        : false,
      roomName,
    );
    await this.daily.destroy();
    await this.joinCall(roomName, token, isBreakoutRoom);
  }

  async onBreakoutSessionStarted(sessionObject) {
    this.sync(sessionObject);
    await this.#join(this.myBreakoutRoom.roomName, true);
  }

  async onBreakoutSessionUpdated(sessionObject) {
    this.sync(sessionObject);
    const room = await this.daily.room();

    if (this.getMyBreakoutRoom()?.roomName !== room?.name) {
      await this.#join(this.myBreakoutRoom.roomName, true);
    }
  }

  async onBreakoutSessionEnded() {
    this.sync({});
    await this.#join(this.roomName, false);
  }
}
