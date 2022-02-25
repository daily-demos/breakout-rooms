import { useCallback } from 'react';

const getDateTimeAfter = (minutes: number) =>
  Math.round(new Date(new Date().getTime() + minutes * 60000).getTime() / 1000);

const useBreakoutRoom = () => {
  const createSession = async (rooms: any, config: any) => {
    const r: Array<any> = [];
    rooms.map((room: any) => {
      if (room?.participants?.length > 0)
        r.push({
          ...room,
          participantIds: room.participants.map((p: any) => p.user_id),
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

    const res = await fetch('/api/socket', options);
    const { status } = await res.json();
    return status;
  };

  const updateSession = async (
    breakoutSession: any,
    newParticipantIds: String[],
  ) => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject: breakoutSession,
        newParticipantIds,
        event: 'DAILY_BREAKOUT_UPDATED',
      }),
    };

    const res = await fetch('/api/socket', options);
    const { status } = await res.json();
    return status;
  };

  const assignRoomToNewParticipant = useCallback(
    async (breakoutSession, participant) => {
      const r = breakoutSession.rooms;
      r[r.length - 1].participants.push(participant);
      r[r.length - 1].participantIds.push(participant.user_id);
      const options = {
        method: 'POST',
        body: JSON.stringify({
          sessionObject: {
            ...breakoutSession,
            rooms: r,
          },
          newParticipantIds: [participant.user_id],
          event: 'DAILY_BREAKOUT_UPDATED',
        }),
      };

      const res = await fetch('/api/socket', options);
      const { status } = await res.json();
      return status;
    },
    [],
  );

  const endSession = async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        event: 'DAILY_BREAKOUT_CONCLUDED',
      }),
    };

    const res = await fetch('/api/socket', options);
    const { status } = await res.json();
    return status;
  };

  return {
    createSession,
    updateSession,
    assignRoomToNewParticipant,
    endSession,
  };
};

export default useBreakoutRoom;
