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
import {
  DailyBreakoutConfig,
  DailyBreakoutProviderRooms,
  DailyBreakoutRoom,
  DailyBreakoutSession,
} from '../types/next';
import { getRoomsInitialValues } from '../lib/room';
import { getDateTimeAfter } from '../lib/date';
import { DailyEventObject, DailyParticipant } from '@daily-co/daily-js';
import {
  useDaily,
  useDailyEvent,
  useLocalParticipant,
} from '@daily-co/daily-react-hooks';
import { shuffle } from '../lib/shuffle';
import { getSampleRooms } from '../lib/getSampleRooms';

type BreakoutRoomProviderType = {
  children: React.ReactNode;
};

interface ContextValue {
  assignRoomToNewParticipant: (
    participant: DailyParticipant,
    roomName?: string,
  ) => void;
  breakoutSession: DailyBreakoutSession;
  config: DailyBreakoutConfig;
  createSession: () => void;
  endSession: () => void;
  isBreakoutRoom: boolean;
  join: boolean;
  joinModalStatus: boolean | undefined;
  manage: boolean;
  myBreakoutRoom: DailyBreakoutRoom | undefined;
  rooms: DailyBreakoutProviderRooms;
  setBreakoutSession: Dispatch<SetStateAction<DailyBreakoutSession | null>>;
  setConfig: Dispatch<SetStateAction<DailyBreakoutConfig>>;
  setIsBreakoutRoom: Dispatch<SetStateAction<boolean>>;
  setJoin: Dispatch<SetStateAction<boolean>>;
  setManage: Dispatch<SetStateAction<boolean>>;
  setRooms: Dispatch<SetStateAction<DailyBreakoutProviderRooms>>;
  setWarn: Dispatch<SetStateAction<boolean>>;
  updateSession: (breakoutSession: DailyBreakoutSession) => void;
  warn: boolean;
  returnToLobby: () => void;
  sendToSocket: (event: string, data: any) => void;
  autoAssign: (totalRooms: number) => void;
  reset: () => void;
}

export const BreakoutContext = createContext<ContextValue>({
  assignRoomToNewParticipant: () => {},
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
  sendToSocket: () => {},
  autoAssign: () => {},
  reset: () => {},
});

export const BreakoutProvider = ({ children }: BreakoutRoomProviderType) => {
  const { room, setShowBreakoutModal, isInRoom, joinAs } = useCall();
  const [isBreakoutRoom, setIsBreakoutRoom] = useState<boolean>(false);
  const [breakoutSession, setBreakoutSession] =
    useState<DailyBreakoutSession | null>(null);
  const [rooms, setRooms] = useState<DailyBreakoutProviderRooms>(
    getRoomsInitialValues(room, new Date()),
  );
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
  const [warn, setWarn] = useState(false);
  const [returnedToLobby, setReturnedToLobby] = useState(false);
  const localParticipant = useLocalParticipant();
  const daily = useDaily();

  useEffect(() => {
    const rooms = getRoomsInitialValues(room, new Date());
    setRooms({ ...rooms });
  }, [room]);

  const myBreakoutRoom: DailyBreakoutRoom | undefined = useMemo(() => {
    return breakoutSession?.rooms.find(room =>
      room?.participantIds?.includes(localParticipant?.user_id as string),
    );
  }, [breakoutSession, localParticipant?.user_id]);

  const handleNewParticipantsState = useCallback(
    (event: DailyEventObject) => {
      if (isBreakoutRoom) return;

      switch (event?.action) {
        case 'joined-meeting':
          const newRooms = getRoomsInitialValues(room, new Date());
          setRooms((rooms: DailyBreakoutProviderRooms) => {
            return {
              ...newRooms,
              unassignedParticipants: Array.from(
                new Set(rooms?.unassignedParticipants).add(
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
                new Set(rooms?.unassignedParticipants).add(
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
                  room.participantIds[idx] = participant.user_id;
                  r.assigned[index] = room;
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
                ...room,
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
    [isBreakoutRoom, room],
  );

  useDailyEvent('joined-meeting', handleNewParticipantsState);
  useDailyEvent('participant-joined', handleNewParticipantsState);
  useDailyEvent('participant-updated', handleNewParticipantsState);
  useDailyEvent('participant-left', handleNewParticipantsState);

  const reset = useCallback(() => {
    if (!daily) return;

    const rooms = getRoomsInitialValues(room, new Date());
    const participants = Object.values(daily.participants()).map(
      p => p.user_id,
    );
    setRooms({ ...rooms, unassignedParticipants: participants });
  }, [daily, room]);

  const sendToSocket = useCallback(
    async (event: string, sessionObject: DailyBreakoutSession | null) => {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          room,
          sessionObject,
          event,
        }),
      };

      const res = await fetch('/api/socket', options);
      const { status } = await res.json();
      return status;
    },
    [room],
  );

  const joinModalStatus = useMemo(() => {
    if (!daily || !breakoutSession || !isInRoom) return false;

    if (!isBreakoutRoom) {
      return breakoutSession.config.auto_join;
    }
  }, [daily, breakoutSession, isBreakoutRoom, isInRoom]);

  const createSession = useCallback(() => {
    const r = rooms.assigned.filter(room => room.participantIds.length > 0);
    const newBreakoutSession: DailyBreakoutSession = {
      rooms: r,
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
    sendToSocket('DAILY_BREAKOUT_STARTED', newBreakoutSession);
  }, [config, rooms, sendToSocket]);

  const updateSession = useCallback(
    (breakoutSession: DailyBreakoutSession) =>
      sendToSocket('DAILY_BREAKOUT_UPDATED', breakoutSession),
    [sendToSocket],
  );

  const assignRoomToNewParticipant = useCallback(
    (
      participant: DailyParticipant,
      roomName: string | undefined = undefined,
    ) => {
      const r = breakoutSession?.rooms;
      if (!r) return;

      if (roomName) {
        const participantOldRoomIndex = r.findIndex(room =>
          room.participantIds.includes(participant.user_id),
        );
        if (participantOldRoomIndex > -1) {
          let oldRoom = r[participantOldRoomIndex];
          if (oldRoom) {
            const oldParticipantIds = oldRoom.participantIds.filter(
              p => p !== participant.user_id,
            );
            r[participantOldRoomIndex] = {
              ...oldRoom,
              participantIds: oldParticipantIds,
            };
          }
        }
        const roomIndex = r.findIndex(room => room.roomName === roomName);
        if (roomIndex > -1) {
          const room = r[roomIndex];
          room?.participantIds.push(participant.user_id);
          r[roomIndex] = room as DailyBreakoutRoom;
        }
      } else {
        const participantsInRooms = r.map(room => room.participantIds.length);
        const minParticipantRoomIndex = participantsInRooms.indexOf(
          Math.min(...participantsInRooms),
        );
        const room = r[minParticipantRoomIndex];
        room?.participantIds.push(participant.user_id);
        r[minParticipantRoomIndex] = room as DailyBreakoutRoom;
      }

      const newBreakoutSession = breakoutSession;
      newBreakoutSession.rooms = r;

      sendToSocket('DAILY_BREAKOUT_UPDATED', newBreakoutSession);
    },
    [breakoutSession, sendToSocket],
  );

  const endSession = useCallback(() => {
    sendToSocket('DAILY_BREAKOUT_CONCLUDED', null);
  }, [sendToSocket]);

  const autoAssign = useCallback(
    (totalRooms: number) => {
      reset();
      setRooms(rooms => {
        const newRooms: DailyBreakoutRoom[] = [];

        const shuffledParticipants = shuffle(rooms.unassignedParticipants);
        const r = getSampleRooms(
          shuffledParticipants,
          Math.ceil(rooms.unassignedParticipants.length / totalRooms),
        );
        Array.from({ length: totalRooms }, (_, i) => {
          newRooms[i] = {
            name: `Breakout room ${i + 1}`,
            roomName: `${room}-${i + 1}`,
            created: new Date(),
            participantIds: [...(r?.[i] || [])],
          };
        });
        return {
          assigned: newRooms,
          unassignedParticipants: [],
        };
      });
    },
    [reset, room],
  );

  const returnToLobby = useCallback(() => {
    setReturnedToLobby(true);
    setShowBreakoutModal(false);
    setJoin(false);

    const r = breakoutSession?.rooms as DailyBreakoutRoom[];
    if (r) {
      const roomIdx = r.findIndex(room =>
        room.participantIds.includes(localParticipant?.user_id as string),
      );
      if (roomIdx > -1) {
        const idxRoom = r[roomIdx];
        if (idxRoom) {
          idxRoom.participantIds = idxRoom.participantIds.filter(
            p => p !== localParticipant?.user_id,
          );
          r[roomIdx] = idxRoom;
          const newBreakoutSession = breakoutSession as DailyBreakoutSession;
          newBreakoutSession.rooms = r;
          sendToSocket('DAILY_BREAKOUT_UPDATED', newBreakoutSession);
          joinAs(room, localParticipant?.owner, true);
        }
      }
    }
  }, [
    setShowBreakoutModal,
    breakoutSession,
    localParticipant?.user_id,
    localParticipant?.owner,
    sendToSocket,
    joinAs,
    room,
  ]);

  return (
    <BreakoutContext.Provider
      value={{
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
        myBreakoutRoom,
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
        sendToSocket,
        autoAssign,
        reset,
      }}
    >
      {children}
    </BreakoutContext.Provider>
  );
};

export const useBreakoutRoom = () => useContext(BreakoutContext);
