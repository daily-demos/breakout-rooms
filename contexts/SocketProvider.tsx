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

type BreakoutEventData = {
  room: string;
  sessionObject: DailyBreakoutSession | null | undefined;
};

interface ContextValue {}

export const SocketContext = createContext<ContextValue>({});

export const SocketProvider = ({ children }: SocketProviderType) => {
  const { room, joinCall, setShowBreakoutModal, joined } = useCall();
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
        room.participantIds.includes(localParticipant?.user_id as string),
      );
    },
    [localParticipant?.user_id],
  );

  const createToken = useCallback(
    async (recordBreakoutRooms: boolean, roomName: string = room) => {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          roomName,
          isOwner: localParticipant?.owner,
          username: localParticipant?.user_name,
          userId: localParticipant?.user_id,
          recordBreakoutRooms,
          prejoinUI: false,
          startVideoOff: !localParticipant?.video,
          startAudioOff: true,
        }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      return token;
    },
    [
      localParticipant?.video,
      localParticipant?.owner,
      localParticipant?.user_id,
      localParticipant?.user_name,
      room,
    ],
  );

  const joinRoom = useCallback(
    async (
      roomName: string,
      breakoutSession: DailyBreakoutSession | null = null,
      isBreakoutRoom: boolean,
    ) => {
      // @ts-ignore
      const urlProperties = daily?.properties.url.split('/');
      const urlRoomName = urlProperties[urlProperties.length - 1];
      if (roomName === urlRoomName) return;

      const token = await createToken(
        isBreakoutRoom
          ? breakoutSession?.config?.record_breakout_sessions ?? false
          : false,
        roomName,
      );
      await joinCall(roomName, token, isBreakoutRoom);
    },
    [createToken, daily?.properties, joinCall],
  );

  const handleBreakoutSessionStarted = useCallback(
    async (data: BreakoutEventData) => {
      if (room !== data.room || !joined) return;

      const newBreakoutSession: DailyBreakoutSession =
        data.sessionObject as DailyBreakoutSession;
      setBreakoutSession(newBreakoutSession);
      setShowBreakoutModal(false);

      const myBreakoutRoom = getMyBreakoutRoom(newBreakoutSession);
      if (!myBreakoutRoom) return;

      setIsBreakoutRoom(true);
      setWarn(true);
      await joinRoom(myBreakoutRoom?.roomName, newBreakoutSession, true);
    },
    [
      joined,
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
    async (data: BreakoutEventData) => {
      if (room !== data.room || !joined) return;

      const newBreakoutSession = data.sessionObject as DailyBreakoutSession;
      setBreakoutSession(newBreakoutSession);
      const roomInfo = (await daily?.room()) as DailyRoomInfo;
      const myBreakoutRoom = getMyBreakoutRoom(
        data.sessionObject as DailyBreakoutSession,
      );
      if (
        myBreakoutRoom?.roomName &&
        myBreakoutRoom?.roomName !== roomInfo?.name
      ) {
        await joinRoom(myBreakoutRoom?.roomName, newBreakoutSession, true);
      }
      setIsBreakoutRoom(!!myBreakoutRoom?.roomName);
    },
    [
      joined,
      room,
      setBreakoutSession,
      daily,
      getMyBreakoutRoom,
      setIsBreakoutRoom,
      joinRoom,
    ],
  );

  const handleBreakoutSessionEnded = useCallback(
    async (data: BreakoutEventData) => {
      if (room !== data.room || !joined) return;

      setBreakoutSession(null);
      await joinRoom(room, null, false);
      setIsBreakoutRoom(false);
    },
    [joined, joinRoom, room, setBreakoutSession, setIsBreakoutRoom],
  );

  const handleBreakoutSessionRequest = useCallback(
    (data: BreakoutEventData) => {
      if (room !== data.room || !joined) return;

      if (breakoutSession && daily) {
        sendToSocket('DAILY_BREAKOUT_SYNC', breakoutSession);
      }
    },
    [joined, breakoutSession, daily, room, sendToSocket],
  );

  const handleBreakoutSessionSync = useCallback(
    (data: BreakoutEventData) => {
      if (room !== data.room || !joined) return;

      setBreakoutSession(data.sessionObject as DailyBreakoutSession);
    },
    [joined, room, setBreakoutSession],
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
