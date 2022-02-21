import { DailyCall } from "@daily-co/daily-js";

const getDateTimeAfter = (minutes: number) =>
  Math.round(new Date(new Date().getTime() + minutes * 60000).getTime() / 1000);

const useBreakoutRoom = (call: DailyCall) => {
  const createSession = async (config: any) => {
    const rooms: Array<any> = [];
    const p = await call.participants();
    const participants = Object.values(p);

    Array.from({length: Math.ceil(participants.length / config.rooms)}, (val, i) => {
      rooms.push({
        name: `Breakout room ${i + 1}`,
        room_url: `forj-breakout-${i + 1}`,
        created: new Date(),
        participants: participants.slice(i * config.rooms, i * config.rooms + config.rooms).map(p => p.user_id),
      });
    });

    const sessionObject = {
      rooms,
      config: {
        auto_join: config.auto_join,
        allow_user_exit: config.allow_user_exit,
        exp: config.exp ? getDateTimeAfter(config.expiryTime): null
      }
    }

    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject,
        event: 'DAILY_BREAKOUT_STARTED'
      }),
    };

    const res = await fetch('/api/pusher', options);
    const { status } = await res.json();
    return status;
  };

  const endSession = async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        event: 'DAILY_BREAKOUT_CONCLUDED'
      }),
    };

    const res = await fetch('/api/pusher', options);
    const { status } = await res.json();
    return status;
  };

  return {
    createSession,
    endSession,
  }
};

export default useBreakoutRoom;