import React, { createContext, useCallback, useEffect } from 'react';
import { io } from 'socket.io-client';
import { useBreakoutRoom } from './BreakoutRoomProvider';
import { useCall } from './CallProvider';
import { useDaily, useLocalParticipant } from '@daily-co/daily-react-hooks';
import { DailyBreakoutRoom, DailyBreakoutSession } from '../types/next';
import { DailyRoomInfo } from '@daily-co/daily-js';

type SocketProviderType = {
  children: React.ReactNode;
};

interface ContextValue {}

export const SocketContext = createContext<ContextValue>(null);

export const SocketProvider = ({ children }: SocketProviderType) => {
  const { room, joinCall, setShowBreakoutModal } = useCall();
  const daily = useDaily();
  const {
    breakoutSession,
    setBreakoutSession,
    setIsBreakoutRoom,
    setWarn,
    sendToSocket,
  } = useBreakoutRoom();
  const localParticipant = useLocalParticipant();

  const getMyBreakoutRoom = useCallback(
    (breakoutSession: DailyBreakoutSession) => {
      return breakoutSession?.rooms?.find((room: DailyBreakoutRoom) =>
        room.participantIds.includes(localParticipant?.user_id),
      );
    },
    [localParticipant?.user_id],
  );

  const createToken = useCallback(
    async (recordBreakoutRooms, roomName = room) => {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          roomName,
          isOwner: localParticipant?.owner,
          username: localParticipant?.user_name,
          userId: localParticipant?.user_id,
          recordBreakoutRooms,
          prejoinUI: false,
          startVideoOff: false,
          startAudioOff: true,
        }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      return token;
    },
    [
      localParticipant?.owner,
      localParticipant?.user_id,
      localParticipant?.user_name,
      room,
    ],
  );

  const joinRoom = useCallback(
    async (roomName: string, isBreakoutRoom: boolean) => {
      const token = await createToken(
        isBreakoutRoom
          ? breakoutSession?.config?.record_breakout_sessions
          : false,
        roomName,
      );
      await joinCall(roomName, token, isBreakoutRoom);
    },
    [breakoutSession?.config?.record_breakout_sessions, createToken, joinCall],
  );

  const handleBreakoutSessionStarted = useCallback(
    async data => {
      if (room !== data.room) return;

      const newBreakoutSession: DailyBreakoutSession = data.sessionObject;
      setBreakoutSession(newBreakoutSession);
      setShowBreakoutModal(false);

      const myBreakoutRoom = getMyBreakoutRoom(newBreakoutSession);
      if (!myBreakoutRoom) return;

      setIsBreakoutRoom(true);
      setWarn(true);
      await joinRoom(myBreakoutRoom?.roomName, true);
    },
    [
      getMyBreakoutRoom,
      joinRoom,
      room,
      setBreakoutSession,
      setIsBreakoutRoom,
      setShowBreakoutModal,
      setWarn,
    ],
  );

  const handleBreakoutSessionUpdated = useCallback(
    async data => {
      if (room !== data.room) return;

      setBreakoutSession(data.sessionObject);
      const roomInfo = (await daily?.room()) as DailyRoomInfo;
      const myBreakoutRoom = getMyBreakoutRoom(data.sessionObject);
      if (
        myBreakoutRoom?.roomName &&
        myBreakoutRoom?.roomName !== roomInfo?.name
      ) {
        await joinRoom(myBreakoutRoom?.roomName, true);
      }
      setIsBreakoutRoom(!!myBreakoutRoom?.roomName);
    },
    [
      room,
      setBreakoutSession,
      daily,
      getMyBreakoutRoom,
      setIsBreakoutRoom,
      joinRoom,
    ],
  );

  const handleBreakoutSessionEnded = useCallback(
    async data => {
      if (room !== data.room) return;

      setBreakoutSession(null);
      await joinRoom(room, false);
      setIsBreakoutRoom(false);
    },
    [joinRoom, room, setBreakoutSession, setIsBreakoutRoom],
  );

  const handleBreakoutSessionRequest = useCallback(
    data => {
      if (room !== data.room) return;

      if (breakoutSession && daily) {
        sendToSocket('DAILY_BREAKOUT_SYNC', breakoutSession);
      }
    },
    [breakoutSession, daily, room, sendToSocket],
  );

  const handleBreakoutSessionSync = useCallback(
    data => {
      if (room !== data.room) return;

      setBreakoutSession(data.sessionObject);
    },
    [room, setBreakoutSession],
  );

  useEffect(() => {
    const socket = io(`${process.env.NEXT_PUBLIC_BASE_URL}`, {
      path: '/api/socketio',
      forceNew: false,
    });

    socket.on('DAILY_BREAKOUT_STARTED', handleBreakoutSessionStarted);
    socket.on('DAILY_BREAKOUT_UPDATED', handleBreakoutSessionUpdated);
    socket.on('DAILY_BREAKOUT_CONCLUDED', handleBreakoutSessionEnded);
    socket.on('DAILY_BREAKOUT_REQUEST', handleBreakoutSessionRequest);
    socket.on('DAILY_BREAKOUT_SYNC', handleBreakoutSessionSync);
    if (socket) {
      return () => {
        socket.disconnect();
      };
    }
  }, [
    daily,
    handleBreakoutSessionEnded,
    handleBreakoutSessionRequest,
    handleBreakoutSessionStarted,
    handleBreakoutSessionSync,
    handleBreakoutSessionUpdated,
    room,
  ]);

  return <SocketContext.Provider value={{}}>{children}</SocketContext.Provider>;
};
