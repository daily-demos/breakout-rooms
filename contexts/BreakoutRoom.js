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

  constructor(callFrame) {
    this.daily = callFrame;
    this.breakoutSession = {};
    this.myBreakoutRoom = null;
  }

  getMyBreakoutRoom() {
    return this.myBreakoutRoom;
  }

  // Prefixed with `#` to make it private function.
  #updateMyBreakoutRoom(breakoutSession) {
    if (breakoutSession?.rooms?.length === 0) {
      this.myBreakoutRoom = null;
    } else {
      const localUser = this.daily?.participants()?.local;
      this.myBreakoutRoom = breakoutSession.rooms.filter(room =>
        room?.participantIds?.includes(localUser?.user_id),
      )[0];
    }
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
    console.log('Updating the breakout session');
    this.breakoutSession = breakoutSession;
    this.#updateMyBreakoutRoom(this.breakoutSession);
    return {
      breakoutSession: this.breakoutSession,
      myBreakoutRoom: this.myBreakoutRoom,
    };
  }

  endSession() {
    console.log('Ending the breakout session');
    this.breakoutSession = {};
    this.#updateMyBreakoutRoom(this.breakoutSession);
    return this.breakoutSession;
  }
}
