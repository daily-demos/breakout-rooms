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
import { DailyEvent, DailyParticipant } from '@daily-co/daily-js';
import { useCall } from './CallProvider';
import {
  DailyBreakoutConfig,
  DailyBreakoutProviderRooms,
  DailyBreakoutRoom,
  DailyBreakoutSession,
} from '../types/next';

const getDateTimeAfter = (minutes: number) =>
  Math.round(new Date(new Date().getTime() + minutes * 60000).getTime() / 1000);

interface ContextValue {
  rooms: DailyBreakoutProviderRooms;
  setRooms: Dispatch<SetStateAction<DailyBreakoutProviderRooms>>;
  config: DailyBreakoutConfig;
  setConfig: Dispatch<SetStateAction<DailyBreakoutConfig>>;
  breakoutSession: DailyBreakoutSession | null;
  setBreakoutSession: Dispatch<SetStateAction<DailyBreakoutSession | null>>;
  myBreakoutRoom: DailyBreakoutRoom;
  createSession: (
    rooms: DailyBreakoutRoom[],
    config: DailyBreakoutConfig,
  ) => {};
  updateSession: (
    breakoutSession: DailyBreakoutSession,
    newParticipantIds: String[],
  ) => {};
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
}

// @ts-ignore
export const BreakoutRoomContext = createContext<ContextValue>(null);

type BreakoutRoomProviderType = {
  children: React.ReactNode;
};

export const roomsInitialValue = (date: Date): DailyBreakoutProviderRooms => {
  return {
    assigned: [
      {
        name: 'Breakout Room 1',
        roomName: `${process.env.NEXT_PUBLIC_DAILY_ROOM_NAME}-1`,
        created: date,
        participants: [],
      },
      {
        name: 'Breakout Room 2',
        roomName: `${process.env.NEXT_PUBLIC_DAILY_ROOM_NAME}-2`,
        created: date,
        participants: [],
      },
    ],
    unassignedParticipants: [],
  };
};

export const BreakoutRoomProvider = ({
  children,
}: BreakoutRoomProviderType) => {
  const { callFrame } = useCall();
  const [join, setJoin] = useState<boolean>(false);
  const [manage, setManage] = useState(false);

  const [isBreakoutRoom, setIsBreakoutRoom] = useState<boolean>(false);
  const [breakoutSession, setBreakoutSession] =
    useState<DailyBreakoutSession | null>(null);
  const [rooms, setRooms] = useState<DailyBreakoutProviderRooms>(
    roomsInitialValue(new Date()),
  );

  const [config, setConfig] = useState<DailyBreakoutConfig>({
    auto_join: true,
    allow_user_exit: true,
    record_breakout_sessions: false,
    exp: true,
    expiryTime: 15,
  });

  const myBreakoutRoom = useMemo(() => {
    if (!breakoutSession) return null;

    const localUser = callFrame?.participants()?.local;
    return breakoutSession.rooms.filter((room: DailyBreakoutRoom) =>
      room.participantIds?.includes(localUser?.user_id),
    )[0];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakoutSession]);

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

  useEffect(() => {
    if (!callFrame) return;

    const events = [
      'joined-meeting',
      'participant-joined',
      'participant-updated',
      'participant-left',
    ];
    handleNewParticipantsState();
    events.forEach((event: string) =>
      callFrame.on(event as DailyEvent, handleNewParticipantsState),
    );
  }, [callFrame, handleNewParticipantsState]);

  const createSession = async (
    rooms: DailyBreakoutRoom[],
    config: DailyBreakoutConfig,
  ) => {
    const r: DailyBreakoutRoom[] = [];
    rooms.map((room: DailyBreakoutRoom) => {
      if (room?.participants?.length > 0)
        r.push({
          ...room,
          participantIds: room.participants.map(
            (p: DailyParticipant) => p.user_id,
          ),
        });
    });

    const sessionObject = {
      rooms: r,
      config: {
        auto_join: config.auto_join,
        allow_user_exit: config.allow_user_exit,
        exp: config.exp ? getDateTimeAfter(config?.expiryTime as number) : null,
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
    breakoutSession: DailyBreakoutSession,
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
    async (participant, roomIndex = null) => {
      const r: DailyBreakoutRoom[] | undefined = breakoutSession?.rooms;
      if (roomIndex) {
        if (r) {
          const room = r[roomIndex];
          room.participants.push(participant);
          room.participantIds?.push(participant.user_id);
          r[roomIndex] = room;
        }
      } else {
        // @ts-ignore
        const participantsInRooms = r.map(
          (room: DailyBreakoutRoom) => room.participants.length,
        );
        const minParticipantRoomIndex = participantsInRooms.indexOf(
          Math.min(...participantsInRooms),
        );
        if (r) {
          const room = r[minParticipantRoomIndex];
          room.participants.push(participant);
          room.participantIds?.push(participant.user_id);
          r[minParticipantRoomIndex] = room;
        }
      }
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
    [breakoutSession],
  );

  const endSession = async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        event: 'DAILY_BREAKOUT_CONCLUDED',
      }),
    };
    setRooms(roomsInitialValue(new Date()));

    const res = await fetch('/api/socket', options);
    const { status } = await res.json();
    return status;
  };

  const showJoinModal = useMemo(() => {
    if (!callFrame) return false;

    if (!breakoutSession) return false;
    if (!isBreakoutRoom) return !breakoutSession.config.auto_join;
  }, [callFrame, breakoutSession, isBreakoutRoom]);

  useEffect(() => {
    if (!callFrame) return;

    const assignParticipant = async () => {
      if (breakoutSession?.config.auto_join) {
        const localUser = await callFrame.participants().local;
        await assignRoomToNewParticipant(localUser as DailyParticipant);
      } else setJoin(true);
    };

    if (!breakoutSession) return;
    if (!isBreakoutRoom) assignParticipant();
  }, [assignRoomToNewParticipant, isBreakoutRoom, breakoutSession, callFrame]);

  return (
    <BreakoutRoomContext.Provider
      value={{
        rooms,
        setRooms,
        config,
        setConfig,
        isBreakoutRoom,
        setIsBreakoutRoom,
        breakoutSession,
        setBreakoutSession,
        myBreakoutRoom,
        createSession,
        updateSession,
        endSession,
        assignRoomToNewParticipant,
        showJoinModal,
        join,
        setJoin,
        manage,
        setManage,
      }}
    >
      {children}
    </BreakoutRoomContext.Provider>
  );
};

export const useBreakoutRoom = () => useContext(BreakoutRoomContext);
