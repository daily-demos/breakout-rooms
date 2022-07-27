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
import { DailyEventObject, DailyParticipant } from '@daily-co/daily-js';

type BreakoutRoomProviderType = {
  children: React.ReactNode;
};

interface ContextValue {
  assignRoomToNewParticipant: (
    participant: DailyParticipant,
    roomName?: string,
  ) => void;

  breakout: any;
  breakoutSession: DailyBreakoutSession;
  config: DailyBreakoutConfig;
  createSession: () => void;
  endSession: () => void;
  isBreakoutRoom: boolean;
  join: boolean;
  joinModalStatus: boolean;
  manage: boolean;
  myBreakoutRoom: DailyBreakoutRoom;
  rooms: DailyBreakoutProviderRooms;
  setBreakoutSession: Dispatch<SetStateAction<DailyBreakoutSession>>;
  setConfig: Dispatch<SetStateAction<DailyBreakoutConfig>>;
  setIsBreakoutRoom: Dispatch<SetStateAction<boolean>>;
  setJoin: Dispatch<SetStateAction<boolean>>;
  setManage: Dispatch<SetStateAction<boolean>>;
  setRooms: Dispatch<SetStateAction<DailyBreakoutProviderRooms>>;
  setWarn: Dispatch<SetStateAction<boolean>>;
  updateSession: (breakoutSession: DailyBreakoutSession) => void;
  warn: boolean;
}

export const BreakoutContext = createContext<ContextValue>({
  assignRoomToNewParticipant: () => {},
  breakout: {},
  breakoutSession: {
    rooms: [],
    config: {
      auto_join: false,
      allow_user_exit: false,
      record_breakout_sessions: false,
      exp: false,
    },
  },
  config: {
    auto_join: false,
    allow_user_exit: false,
    record_breakout_sessions: false,
    exp: false,
  },
  createSession: () => {},
  endSession: () => {},
  isBreakoutRoom: false,
  join: false,
  joinModalStatus: false,
  manage: false,
  myBreakoutRoom: {
    name: '',
    roomName: '',
    created: new Date(),
    participants: [],
  },
  rooms: {
    assigned: [
      {
        name: 'Breakout Room 1',
        roomName: `1`,
        created: new Date(),
        participants: [],
      },
      {
        name: 'Breakout Room 2',
        roomName: `2`,
        created: new Date(),
        participants: [],
      },
    ],
    unassignedParticipants: [],
  },
  setBreakoutSession: () => {},
  setConfig: () => {},
  setIsBreakoutRoom: () => {},
  setJoin: () => {},
  setManage: () => {},
  setRooms: () => {},
  setWarn: () => {},
  updateSession: () => {},
  warn: false,
});

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
    max_participants: false,
    max_participants_count: 5,
  });
  const [join, setJoin] = useState(false);
  const [manage, setManage] = useState(false);
  const [breakout, setBreakout] = useState(null);
  const [warn, setWarn] = useState(false);
  const localParticipant = callFrame?.participants().local;

  useEffect(() => {
    const rooms = getRoomsInitialValues(room, new Date());
    setRooms({ ...rooms });
  }, [room]);

  useEffect(() => {
    if (config.max_participants) {
      const maxParticipants = config.max_participants_count;
      const totalParticipants = callFrame?.participantCounts().present;
      const maxNumberOfRooms = Math.ceil(totalParticipants / maxParticipants);
      const rooms = getRoomsInitialValues(room, new Date(), maxNumberOfRooms);
      setRooms(r => {
        return { ...rooms, unassignedParticipants: r.unassignedParticipants };
      });
      if (breakout) {
        const autoAssignRooms: DailyBreakoutRoom[] = breakout.autoAssign(
          rooms.assigned.length,
        );
        setRooms({ assigned: autoAssignRooms, unassignedParticipants: [] });
      }
    }
  }, [
    breakout,
    callFrame,
    config.max_participants,
    config.max_participants_count,
    room,
  ]);

  const createToken = useCallback(
    async (recordBreakoutRooms, roomName = room, localParticipant) => {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          roomName,
          isOwner: localParticipant?.owner,
          username: localParticipant?.user_name,
          userId: localParticipant?.user_id,
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
    [room],
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

  const onBreakoutConcluded = useCallback(async () => {
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

  const handleNewParticipantsState = useCallback(
    (event: DailyEventObject) => {
      if (!localParticipant?.owner || isBreakoutRoom) return;

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
    [localParticipant?.owner, isBreakoutRoom],
  );

  useEffect(() => {
    if (!callFrame) return;

    callFrame.on('joined-meeting', handleNewParticipantsState);
    callFrame.on('participant-joined', handleNewParticipantsState);
    callFrame.on('participant-updated', handleNewParticipantsState);
    callFrame.on('participant-left', handleNewParticipantsState);
  }, [callFrame, handleNewParticipantsState]);

  useEffect(() => {
    if (!callFrame) return;

    const handleJoinedMeeting = () => {
      setTimeout(async () => {
        const participants = await callFrame.participants();
        const rooms = getRoomsInitialValues(room, new Date());
        setRooms({
          ...rooms,
          unassignedParticipants: Object.values(participants),
        });
      }, 1000);
    };
    callFrame.on('joined-meeting', handleJoinedMeeting);
  }, [callFrame, room]);

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

  const updateSession = useCallback(
    (breakoutSession: DailyBreakoutSession) =>
      breakout?.updateSession(breakoutSession),
    [breakout],
  );

  const assignRoomToNewParticipant = useCallback(
    (participant: DailyParticipant, roomName: string) =>
      breakout?.assignRoomToNewParticipant(participant, roomName),
    [breakout],
  );

  const endSession = useCallback(() => breakout?.endSession(), [breakout]);

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
