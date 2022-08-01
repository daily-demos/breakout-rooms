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
  returnToLobby: () => void;
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
      allow_user_switch_room: true,
    },
  },
  config: {
    auto_join: false,
    allow_user_exit: false,
    record_breakout_sessions: false,
    exp: false,
    allow_user_switch_room: true,
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
    participantIds: [],
  },
  rooms: {
    assigned: [
      {
        name: 'Breakout Room 1',
        roomName: `1`,
        created: new Date(),
        participantIds: [],
      },
      {
        name: 'Breakout Room 2',
        roomName: `2`,
        created: new Date(),
        participantIds: [],
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
  returnToLobby: () => {},
});

export const BreakoutProvider = ({ children }: BreakoutRoomProviderType) => {
  const { callFrame, joinCall, room, setShowBreakoutModal, isInRoom, joinAs } =
    useCall();

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
    allow_user_switch_room: true,
  });
  const [join, setJoin] = useState(false);
  const [manage, setManage] = useState(false);
  const [breakout, setBreakout] = useState(null);
  const [warn, setWarn] = useState(false);
  const [returnedToLobby, setReturnedToLobby] = useState(false);
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
          startVideoOff: false,
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
    setIsBreakoutRoom(!!breakout.getMyBreakoutRoom()?.roomName);
  }, []);

  const onBreakoutConcluded = useCallback(async () => {
    setIsBreakoutRoom(false);
    setMyRoom(null);
    setBreakoutSession(null);
  }, []);

  const onBreakoutSync = useCallback(breakout => {
    setBreakoutSession(breakout.getBreakoutSession());
    setMyRoom(breakout.getMyBreakoutRoom());
  }, []);

  const eventHandlers = useMemo(() => {
    return {
      onBreakoutStarted,
      onBreakoutUpdated,
      onBreakoutConcluded,
      onBreakoutSync,
    };
  }, [
    onBreakoutConcluded,
    onBreakoutStarted,
    onBreakoutUpdated,
    onBreakoutSync,
  ]);

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
      if (isBreakoutRoom) return;

      switch (event?.action) {
        case 'joined-meeting':
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            return {
              ...rooms,
              unassignedParticipants: Array.from(
                new Set(rooms.unassignedParticipants).add(
                  event.participants.local.user_id,
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
                new Set(rooms.unassignedParticipants).add(
                  event.participant.user_id,
                ),
              ),
            };
          });
          break;
        case 'participant-updated':
          const participant = event.participant;
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            const r = rooms;
            const idx = r.unassignedParticipants?.findIndex(
              (p: string) => p === participant.user_id,
            );
            if (idx >= 0) {
              r.unassignedParticipants[idx] = participant.user_id;
            } else {
              r.assigned.map((room: DailyBreakoutRoom, index: number) => {
                const idx = room.participantIds?.findIndex(
                  (p: string) => p === participant.user_id,
                );
                if (idx >= 0) {
                  r.assigned[index].participantIds[idx] = participant.user_id;
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
                participantIds: [
                  ...room.participantIds.filter((p: string) => p !== idx),
                ],
              };
            });
            return {
              ...rooms,
              assigned,
              unassignedParticipants: [
                ...rooms.unassignedParticipants.filter(
                  (p: string) => p !== idx,
                ),
              ],
            };
          });
          break;
        default:
          break;
      }
    },
    [isBreakoutRoom],
  );

  useEffect(() => {
    if (!callFrame) return;

    callFrame.on('joined-meeting', handleNewParticipantsState);
    callFrame.on('participant-joined', handleNewParticipantsState);
    callFrame.on('participant-updated', handleNewParticipantsState);
    callFrame.on('participant-left', handleNewParticipantsState);
  }, [callFrame, handleNewParticipantsState]);

  const joinModalStatus = useMemo(() => {
    if (!callFrame || !breakoutSession) return false;

    if (!isBreakoutRoom) {
      if (isInRoom && !returnedToLobby)
        setJoin(breakoutSession.config.auto_join);
      return breakoutSession.config.auto_join;
    }
  }, [callFrame, breakoutSession, returnedToLobby, isBreakoutRoom, isInRoom]);

  const createSession = useCallback(() => {
    const properties = {
      rooms: rooms?.assigned,
      config: {
        auto_join: config.auto_join,
        allow_user_exit: config.allow_user_exit,
        exp: config.exp ? getDateTimeAfter(config?.expiryTime as number) : null,
        record_breakout_sessions: config.record_breakout_sessions,
        allow_user_switch_room: config.allow_user_switch_room,
        max_participants: config.max_participants,
        max_participants_count: config.max_participants_count,
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

  const returnToLobby = useCallback(() => {
    setReturnedToLobby(true);
    setShowBreakoutModal(false);
    setJoin(false);
    breakout?.leaveSession();
    joinAs(room, localParticipant?.owner, true);
  }, [breakout, joinAs, localParticipant?.owner, room, setShowBreakoutModal]);

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
        returnToLobby,
      }}
    >
      {children}
    </BreakoutContext.Provider>
  );
};

export const useBreakoutRoom = () => useContext(BreakoutContext);
