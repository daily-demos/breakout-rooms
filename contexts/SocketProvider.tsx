import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { DailyBreakoutRoom, DailyBreakoutSession } from '../types/next';
import equal from 'fast-deep-equal';
import { useBreakoutRoom } from './BreakoutRoomProvider';
import { useCall } from './CallProvider';

type SocketProviderType = {
  children: React.ReactNode;
};

interface ContextValue {
  isOwner: boolean;
  warn: boolean;
  setWarn: Dispatch<SetStateAction<boolean>>;
  joinAs: (owner?: boolean, disablePrejoin?: boolean) => void;
}

// @ts-ignore
export const SocketContext = createContext<ContextValue>(null);

export const SocketProvider = ({ children }: SocketProviderType) => {
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [warn, setWarn] = useState<boolean>(false);

  const { callFrame, joinCall, setShowBreakoutModal } = useCall();
  const { breakoutSession, setBreakoutSession, setIsBreakoutRoom } =
    useBreakoutRoom();

  const joinBreakoutRoom = useCallback(
    async (sessionObject: DailyBreakoutSession) => {
      if (!callFrame) return;

      const localUser = await callFrame?.participants().local;

      sessionObject.rooms?.map(async (room: DailyBreakoutRoom) => {
        if (room.participantIds?.includes(localUser?.user_id)) {
          const options = {
            method: 'POST',
            body: JSON.stringify({
              roomName: room.roomName,
              isOwner,
              username: localUser?.user_name,
              userId: localUser?.user_id,
              recordBreakoutRooms:
                sessionObject.config.record_breakout_sessions,
              prejoinUI: false,
            }),
          };

          const res = await fetch('/api/token', options);
          const { token } = await res.json();
          await callFrame.destroy();
          await joinCall(room.roomName, token, true);
          setWarn(true);
        }
      });
    },
    [callFrame, isOwner, joinCall],
  );

  const joinAs = useCallback(
    async (owner: boolean = false, disablePrejoin: boolean = false) => {
      const body: { [key: string]: string | boolean } = {
        roomName: process.env.NEXT_PUBLIC_DAILY_ROOM_NAME as string,
        isOwner: owner,
        prejoinUI: !disablePrejoin,
      };

      if (disablePrejoin) {
        const localUser = await callFrame.participants().local;
        body.username = localUser.user_name;
        body.userId = localUser.user_id;
      }

      const options = {
        method: 'POST',
        body: JSON.stringify(body),
      };
      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      setIsOwner(owner);

      if (disablePrejoin) await callFrame?.destroy();
      await joinCall(process.env.NEXT_PUBLIC_DAILY_ROOM_NAME as string, token);
    },
    [callFrame, joinCall],
  );

  const handleBreakoutSessionStarted = useCallback(
    async (data: { sessionObject: DailyBreakoutSession }) => {
      setShowBreakoutModal(false);
      setIsBreakoutRoom(true);
      setBreakoutSession(data.sessionObject);
      await joinBreakoutRoom(data.sessionObject);
    },
    [
      joinBreakoutRoom,
      setBreakoutSession,
      setIsBreakoutRoom,
      setShowBreakoutModal,
    ],
  );

  const handleBreakoutSessionUpdated = useCallback(
    async (data: any) => {
      setIsBreakoutRoom(true);
      setBreakoutSession(data.sessionObject);

      const localUser = await callFrame?.participants()?.local;
      if (
        data.newParticipantIds &&
        data.newParticipantIds.includes(localUser?.user_id)
      ) {
        await joinBreakoutRoom(data.sessionObject);
      }
    },
    [callFrame, joinBreakoutRoom, setBreakoutSession, setIsBreakoutRoom],
  );

  const handleBreakoutSessionEnded = useCallback(() => {
    setShowBreakoutModal(false);
    setBreakoutSession(null);
    setIsBreakoutRoom(false);
    setWarn(false);
    joinAs(isOwner, true);
  }, [
    isOwner,
    joinAs,
    setBreakoutSession,
    setIsBreakoutRoom,
    setShowBreakoutModal,
  ]);

  const handleBreakoutSessionRequest = useCallback(async () => {
    if (breakoutSession && callFrame) {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          sessionObject: breakoutSession,
          event: 'DAILY_BREAKOUT_SYNC',
        }),
      };

      await fetch('/api/socket', options);
    }
  }, [breakoutSession, callFrame]);

  const handleBreakoutSessionSync = useCallback(
    (data: { sessionObject: DailyBreakoutSession }) => {
      if (equal(data.sessionObject, breakoutSession)) return;
      setBreakoutSession(data.sessionObject);
    },
    [breakoutSession, setBreakoutSession],
  );

  useEffect((): any => {
    const socket = io(process.env.NEXT_PUBLIC_BASE_URL as string, {
      path: '/api/socketio',
    });

    socket.on('connect', () => {
      console.log('SOCKET CONNECTED!', socket.id);
    });

    socket.on('DAILY_BREAKOUT_STARTED', handleBreakoutSessionStarted);
    socket.on('DAILY_BREAKOUT_UPDATED', handleBreakoutSessionUpdated);
    socket.on('DAILY_BREAKOUT_CONCLUDED', handleBreakoutSessionEnded);
    socket.on('DAILY_BREAKOUT_REQUEST', handleBreakoutSessionRequest);
    socket.on('DAILY_BREAKOUT_SYNC', handleBreakoutSessionSync);
    if (socket) return () => socket.disconnect();
  }, [
    callFrame,
    handleBreakoutSessionEnded,
    handleBreakoutSessionRequest,
    handleBreakoutSessionStarted,
    handleBreakoutSessionSync,
    handleBreakoutSessionUpdated,
  ]);

  return (
    <SocketContext.Provider
      value={{
        isOwner,
        warn,
        setWarn,
        joinAs,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
