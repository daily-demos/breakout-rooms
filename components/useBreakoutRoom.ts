const getDateTimeAfter = (minutes: number) =>
  Math.round(new Date(new Date().getTime() + minutes * 60000).getTime() / 1000);

const useBreakoutRoom = () => {
  const createSession = async (rooms: any, config: any) => {
    const r: Array<any> = [];
    rooms.map((room: any) => {
      if (room.participants.length > 0)
        r.push({
          ...room,
          participants: room.participants.map((p: any) => p.user_id),
        });
    });

    const sessionObject = {
      rooms: r,
      config: {
        auto_join: config.auto_join,
        allow_user_exit: config.allow_user_exit,
        exp: config.exp ? getDateTimeAfter(config.expiryTime) : null,
        record_breakout_sessions: config.record_breakout_sessions,
      },
    };

    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject,
        event: 'DAILY_BREAKOUT_STARTED',
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
        event: 'DAILY_BREAKOUT_CONCLUDED',
      }),
    };

    const res = await fetch('/api/pusher', options);
    const { status } = await res.json();
    return status;
  };

  return {
    createSession,
    endSession,
  };
};

export default useBreakoutRoom;
