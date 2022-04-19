import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DailyParticipant } from '@daily-co/daily-js';
import { useCall } from './CallProvider';
import { getRoomsInitialValues } from '../utils/getRooms';
import { getDateTimeAfter } from '../utils/getTimeAfter';
import {
  DailyBreakoutConfig,
  DailyBreakoutProviderRooms,
  DailyBreakoutRoom,
  DailyBreakoutSession,
} from '../types/next';
import {
  useDailyEvent,
  useLocalParticipant,
} from '@daily-co/daily-react-hooks';
import BreakoutRoom from './BreakoutRoom';
import { io } from 'socket.io-client';

interface ContextValue {
  breakout: any;
  rooms: DailyBreakoutProviderRooms;
  setRooms: Dispatch<SetStateAction<DailyBreakoutProviderRooms>>;
  config: DailyBreakoutConfig;
  setConfig: Dispatch<SetStateAction<DailyBreakoutConfig>>;
  breakoutSession: DailyBreakoutSession | null;
  setBreakoutSession: Dispatch<SetStateAction<DailyBreakoutSession | null>>;
  myBreakoutRoom: DailyBreakoutRoom;
  setMyBreakoutRoom: Dispatch<SetStateAction<DailyBreakoutRoom | null>>;
  createSession: (
    rooms: DailyBreakoutRoom[],
    config: DailyBreakoutConfig,
  ) => {};
  updateSession: (breakoutSession: DailyBreakoutSession) => {};
  endSession: () => {};
  assignRoomToNewParticipant: (
    participant: DailyParticipant,
    roomIndex?: number,
  ) => {};
  isBreakoutRoom: boolean;
  setIsBreakoutRoom: Dispatch<SetStateAction<boolean>>;
  showJoinModal: boolean;
  join: boolean;
  setJoin: Dispatch<SetStateAction<boolean>>;
  manage: boolean;
  setManage: Dispatch<SetStateAction<boolean>>;
  warn: boolean;
  setWarn: Dispatch<SetStateAction<boolean>>;
  joinAs: (owner?: boolean, disablePrejoin?: boolean) => void;
}

// @ts-ignore
export const BreakoutRoomContext = createContext<ContextValue>(null);

type BreakoutRoomProviderType = {
  children: React.ReactNode;
};

export const BreakoutRoomProvider = ({
  children,
}: BreakoutRoomProviderType) => {
  const { callFrame, joinCall, setShowBreakoutModal } = useCall();
  const [join, setJoin] = useState<boolean>(false);
  const [manage, setManage] = useState(false);
  const [warn, setWarn] = useState<boolean>(false);

  const [isBreakoutRoom, setIsBreakoutRoom] = useState<boolean>(false);
  const [breakoutSession, setBreakoutSession] =
    useState<DailyBreakoutSession | null>(null);
  const [rooms, setRooms] = useState<DailyBreakoutProviderRooms>(
    getRoomsInitialValues(new Date()),
  );

  const [myRoom, setMyRoom] = useState(null);

  const [config, setConfig] = useState<DailyBreakoutConfig>({
    auto_join: true,
    allow_user_exit: true,
    record_breakout_sessions: false,
    exp: true,
    expiryTime: 15,
  });
  const localParticipant = useLocalParticipant();

  const createToken = useCallback(
    async (
      recordBreakoutRooms,
      roomName = process.env.NEXT_PUBLIC_DAILY_ROOM_NAME,
    ) => {
      const localUser = callFrame?.participants().local;
      const options = {
        method: 'POST',
        body: JSON.stringify({
          roomName,
          isOwner: localUser?.owner,
          username: localUser?.user_name,
          userId: localUser?.user_id,
          recordBreakoutRooms,
          prejoinUI: false,
        }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      return token;
    },
    [callFrame],
  );

  const breakout = useMemo(
    () => new BreakoutRoom(callFrame, joinCall, createToken),
    [callFrame, createToken, joinCall],
  );

  const onBreakoutStarted = useCallback(
    breakoutSession => {
      setBreakoutSession(breakoutSession);
      setMyRoom(breakout.getMyBreakoutRoom());
      setShowBreakoutModal(false);
      setIsBreakoutRoom(true);
      setWarn(true);
    },
    [breakout, setShowBreakoutModal],
  );

  const onBreakoutUpdated = useCallback(
    breakoutSession => {
      setBreakoutSession(breakoutSession);
      setMyRoom(breakout.getMyBreakoutRoom());
      setIsBreakoutRoom(true);
    },
    [breakout],
  );

  const onBreakoutConcluded = useCallback(() => {
    setMyRoom(null);
    setShowBreakoutModal(false);
    setBreakoutSession(null);
    setIsBreakoutRoom(false);
    setWarn(false);
  }, [setShowBreakoutModal]);

  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_BASE_URL as string, {
      path: '/api/socketio',
    });

    socket.on('DAILY_BREAKOUT_STARTED', data => {
      breakout
        .onBreakoutSessionStarted(data)
        .finally(() => onBreakoutStarted(data.sessionObject));
    });
    socket.on('DAILY_BREAKOUT_UPDATED', data => {
      breakout
        .onBreakoutSessionUpdated(data)
        .finally(() => onBreakoutUpdated(data.sessionObject));
    });
    socket.on('DAILY_BREAKOUT_CONCLUDED', () => {
      breakout.onBreakoutSessionEnded();
      onBreakoutConcluded();
    });
    socket.on('DAILY_BREAKOUT_REQUEST', breakout.onBreakoutSessionRequest);
    socket.on('DAILY_BREAKOUT_SYNC', breakout.onBreakoutSessionSync);
  }, [
    breakout,
    breakout.onBreakoutSessionEnded,
    breakout.onBreakoutSessionRequest,
    breakout.onBreakoutSessionStarted,
    breakout.onBreakoutSessionSync,
    breakout.onBreakoutSessionUpdated,
    onBreakoutConcluded,
    onBreakoutStarted,
    onBreakoutUpdated,
  ]);

  const handleNewParticipantsState = useCallback(
    (event = null) => {
      if (isBreakoutRoom || !localParticipant?.owner) return;

      switch (event?.action) {
        case 'joined-meeting':
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            return {
              ...rooms,
              unassignedParticipants: Array.from(
                new Set(rooms.unassignedParticipants).add(
                  event.participants.local,
                ),
              ),
            };
          });
          break;
        case 'participant-joined':
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            return {
              ...rooms,
              unassignedParticipants: Array.from(
                new Set(rooms.unassignedParticipants).add(event.participant),
              ),
            };
          });
          break;
        case 'participant-updated':
          const participant = event.participant;
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            const r = rooms;
            const idx = r.unassignedParticipants?.findIndex(
              (p: DailyParticipant) => p.user_id === participant.user_id,
            );
            if (idx >= 0) {
              r.unassignedParticipants[idx] = participant;
            } else {
              r.assigned.map((room: DailyBreakoutRoom, index: number) => {
                const idx = room.participants?.findIndex(
                  (p: DailyParticipant) => p.user_id === participant.user_id,
                );
                if (idx >= 0) {
                  r.assigned[index].participants[idx] = participant;
                }
              });
            }
            return {
              ...r,
            };
          });
          break;
        case 'participant-left':
          const idx = event.participant.user_id;
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            const assigned = rooms.assigned;
            assigned.map((room: DailyBreakoutRoom, index: number) => {
              assigned[index] = {
                ...rooms.assigned[index],
                participants: [
                  ...room?.participants?.filter(
                    (p: DailyParticipant) => p.user_id !== idx,
                  ),
                ],
              };
            });
            return {
              ...rooms,
              assigned,
              unassignedParticipants: [
                ...rooms.unassignedParticipants.filter(
                  (p: DailyParticipant) => p.user_id !== idx,
                ),
              ],
            };
          });
          break;
        default:
          break;
      }
    },
    [isBreakoutRoom, localParticipant?.owner],
  );

  useDailyEvent('joined-meeting', handleNewParticipantsState);
  useDailyEvent('participant-joined', handleNewParticipantsState);
  useDailyEvent('participant-updated', handleNewParticipantsState);
  useDailyEvent('participant-left', handleNewParticipantsState);

  const createSession = async (
    rooms: DailyBreakoutRoom[],
    config: DailyBreakoutConfig,
  ) => {
    const properties = {
      rooms,
      config: {
        auto_join: config.auto_join,
        allow_user_exit: config.allow_user_exit,
        exp: config.exp ? getDateTimeAfter(config?.expiryTime as number) : null,
        record_breakout_sessions: config.record_breakout_sessions,
      },
    };
    breakout?.startSession(properties);
  };

  const updateSession = breakout?.updateSession;
  const assignRoomToNewParticipant = breakout?.assignRoomToNewParticipant;

  const endSession = async () => {
    breakout?.endSession();
    setRooms(getRoomsInitialValues(new Date()));
  };

  const showJoinModal = useMemo(() => {
    if (!callFrame) return false;

    if (!breakoutSession) return false;
    if (!isBreakoutRoom) return !breakoutSession.config.auto_join;
  }, [callFrame, breakoutSession, isBreakoutRoom]);

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

      if (disablePrejoin) await callFrame?.destroy();
      await joinCall(process.env.NEXT_PUBLIC_DAILY_ROOM_NAME as string, token);
    },
    [callFrame, joinCall],
  );

  // useEffect(() => {
  //   if (!callFrame) return;
  //
  //   const assignParticipant = async () => {
  //     if (breakoutSession?.config.auto_join) {
  //       const localUser = await callFrame.participants().local;
  //       assignRoomToNewParticipant(localUser as DailyParticipant);
  //     } else setJoin(true);
  //   };
  //
  //   if (!breakoutSession) return;
  //   if (!isBreakoutRoom) assignParticipant();
  // }, [assignRoomToNewParticipant, isBreakoutRoom, breakoutSession, callFrame]);

  return (
    <BreakoutRoomContext.Provider
      value={{
        breakout,
        rooms,
        setRooms,
        config,
        setConfig,
        isBreakoutRoom,
        setIsBreakoutRoom,
        breakoutSession,
        setBreakoutSession,
        myBreakoutRoom: myRoom,
        setMyBreakoutRoom: setMyRoom,
        createSession,
        updateSession,
        endSession,
        assignRoomToNewParticipant,
        showJoinModal,
        join,
        setJoin,
        manage,
        setManage,
        warn,
        setWarn,
        joinAs,
      }}
    >
      {children}
    </BreakoutRoomContext.Provider>
  );
};

export const useBreakoutRoom = () => useContext(BreakoutRoomContext);
