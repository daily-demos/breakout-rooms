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
import { useCall } from './CallProvider';
import BreakoutRoom from '../lib/BreakoutRoom';
import {
  DailyBreakoutConfig,
  DailyBreakoutProviderRooms,
  DailyBreakoutRoom,
  DailyBreakoutSession,
} from '../types/next';
import { getRoomsInitialValues } from '../lib/room';
import { getDateTimeAfter } from '../lib/date';
import { DailyParticipant } from '@daily-co/daily-js';
import { useDailyEvent } from '@daily-co/daily-react-hooks';
import { io } from 'socket.io-client';

type BreakoutRoomProviderType = {
  children: React.ReactNode;
};

interface ContextValue {
  breakout: any;
  isBreakoutRoom: boolean;
  setIsBreakoutRoom: Dispatch<SetStateAction<boolean>>;
  join: boolean;
  setJoin: Dispatch<SetStateAction<boolean>>;
  manage: boolean;
  setManage: Dispatch<SetStateAction<boolean>>;
  warn: boolean;
  setWarn: Dispatch<SetStateAction<boolean>>;
  breakoutSession: DailyBreakoutSession;
  setBreakoutSession: Dispatch<SetStateAction<DailyBreakoutSession>>;
  rooms: DailyBreakoutProviderRooms;
  setRooms: Dispatch<SetStateAction<DailyBreakoutProviderRooms>>;
  myBreakoutRoom: DailyBreakoutRoom;
  config: DailyBreakoutConfig;
  setConfig: Dispatch<SetStateAction<DailyBreakoutConfig>>;
  createSession: () => void;
  updateSession: (breakoutSession: DailyBreakoutSession) => {};
  endSession: () => void;
  assignRoomToNewParticipant: (
    participant: DailyParticipant,
    roomIndex?: number,
  ) => {};
  joinModalStatus: boolean;
}

// @ts-ignore
export const BreakoutContext = createContext<ContextValue>(null);

export const BreakoutProvider = ({ children }: BreakoutRoomProviderType) => {
  const { callFrame, joinCall, room, setShowBreakoutModal } = useCall();

  const [isBreakoutRoom, setIsBreakoutRoom] = useState<boolean>(false);
  const [breakoutSession, setBreakoutSession] =
    useState<DailyBreakoutSession | null>(null);
  const [rooms, setRooms] = useState<DailyBreakoutProviderRooms>();
  const [myRoom, setMyRoom] = useState(null);
  const [config, setConfig] = useState<DailyBreakoutConfig>({
    auto_join: true,
    allow_user_exit: true,
    record_breakout_sessions: false,
    exp: true,
    expiryTime: 15,
  });
  const [join, setJoin] = useState(false);
  const [manage, setManage] = useState(false);
  const [breakout, setBreakout] = useState(null);
  const [warn, setWarn] = useState(false);

  useEffect(() => {
    const rooms = getRoomsInitialValues(room, new Date());
    setRooms({ ...rooms });
  }, [room]);

  const createToken = useCallback(
    async (recordBreakoutRooms, roomName = room) => {
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
          startVideoOff: true,
          startAudioOff: true,
        }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      return token;
    },
    [callFrame, room],
  );

  const onBreakoutStarted = useCallback(
    breakout => {
      setShowBreakoutModal(false);
      setBreakoutSession(breakout.getBreakoutSession());
      setMyRoom(breakout.getMyBreakoutRoom());
      setIsBreakoutRoom(true);
      setWarn(true);
    },
    [setShowBreakoutModal],
  );

  const onBreakoutUpdated = useCallback(breakout => {
    setBreakoutSession(breakout.getBreakoutSession());
    setMyRoom(breakout.getMyBreakoutRoom());
    setIsBreakoutRoom(true);
  }, []);

  const onBreakoutConcluded = useCallback(() => {
    setIsBreakoutRoom(false);
    setMyRoom(null);
    setBreakoutSession(null);
  }, []);

  const eventHandlers = useMemo(() => {
    return { onBreakoutStarted, onBreakoutUpdated, onBreakoutConcluded };
  }, [onBreakoutConcluded, onBreakoutStarted, onBreakoutUpdated]);

  useEffect(() => {
    if (breakout) {
      setBreakout(breakout.updateCallFrame(callFrame));
      return;
    }

    if (callFrame && room) {
      const b = new BreakoutRoom(
        callFrame,
        joinCall,
        room,
        createToken,
        eventHandlers,
      );
      setBreakout(b);
    }
  }, [breakout, callFrame, createToken, eventHandlers, joinCall, room]);

  const handleNewParticipantsState = useCallback((event = null) => {
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
  }, []);

  useDailyEvent('joined-meeting', handleNewParticipantsState);
  useDailyEvent('participant-joined', handleNewParticipantsState);
  useDailyEvent('participant-updated', handleNewParticipantsState);
  useDailyEvent('participant-left', handleNewParticipantsState);

  const joinModalStatus = useMemo(() => {
    if (!callFrame) return false;

    if (!breakoutSession) return false;
    if (!isBreakoutRoom) return !breakoutSession.config.auto_join;
  }, [callFrame, breakoutSession, isBreakoutRoom]);

  const createSession = useCallback(() => {
    const properties = {
      rooms: rooms?.assigned,
      config: {
        auto_join: config.auto_join,
        allow_user_exit: config.allow_user_exit,
        exp: config.exp ? getDateTimeAfter(config?.expiryTime as number) : null,
        record_breakout_sessions: config.record_breakout_sessions,
      },
    };
    breakout?.startSession(properties);
  }, [breakout, config, rooms]);

  const updateSession = useCallback(() => breakout?.updateSession, [breakout]);

  const assignRoomToNewParticipant = useCallback(
    (participant: DailyParticipant, roomIndex?: number) =>
      breakout?.assignRoomToNewParticipant(participant, roomIndex),
    [breakout],
  );

  const endSession = useCallback(() => {
    breakout?.endSession();
    setRooms(getRoomsInitialValues(room, new Date()));
  }, [breakout, room]);

  return (
    <BreakoutContext.Provider
      value={{
        breakout,
        isBreakoutRoom,
        setIsBreakoutRoom,
        join,
        setJoin,
        manage,
        setManage,
        warn,
        setWarn,
        breakoutSession: breakoutSession as DailyBreakoutSession,
        setBreakoutSession,
        myBreakoutRoom: myRoom as unknown as DailyBreakoutRoom,
        rooms,
        setRooms,
        config,
        setConfig,
        createSession,
        updateSession,
        endSession,
        assignRoomToNewParticipant,
        joinModalStatus,
      }}
    >
      {children}
    </BreakoutContext.Provider>
  );
};

export const useBreakoutRoom = () => useContext(BreakoutContext);
