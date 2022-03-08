import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { DailyEvent, DailyParticipant } from '@daily-co/daily-js';
import { useCall } from './CallProvider';

const getDateTimeAfter = (minutes: number) =>
  Math.round(new Date(new Date().getTime() + minutes * 60000).getTime() / 1000);

interface ContextValue {
  rooms: any;
  setRooms: Dispatch<SetStateAction<any>>;
  config: any;
  setConfig: Dispatch<SetStateAction<any>>;
  breakoutSession: any;
  setBreakoutSession: Dispatch<SetStateAction<any>>;
  createSession: (rooms: any, config: any) => {};
  updateSession: (breakoutSession: any, newParticipantIds: String[]) => {};
  endSession: () => {};
  assignRoomToNewParticipant: (
    participant: DailyParticipant,
    roomIndex?: number,
  ) => {};
  isBreakoutRoom: boolean;
  setIsBreakoutRoom: Dispatch<SetStateAction<boolean>>;
}

// @ts-ignore
export const BreakoutRoomContext = createContext<ContextValue>(null);

type BreakoutRoomProviderType = {
  children: React.ReactNode;
};

export const roomsInitialValue = (date: Date) => {
  return {
    assigned: [
      {
        name: 'Breakout Room 1',
        room_url: `${process.env.NEXT_PUBLIC_DAILY_ROOM}-1`,
        created: date,
        participants: [],
      },
      {
        name: 'Breakout Room 2',
        room_url: `${process.env.NEXT_PUBLIC_DAILY_ROOM}-2`,
        created: date,
        participants: [],
      },
    ],
    unassigned: [],
  };
};

export const BreakoutRoomProvider = ({
  children,
}: BreakoutRoomProviderType) => {
  const { callFrame } = useCall();
  const [isBreakoutRoom, setIsBreakoutRoom] = useState<boolean>(false);
  const [breakoutSession, setBreakoutSession] = useState<any>(null);
  const [rooms, setRooms] = useState<any>(roomsInitialValue(new Date()));

  const [config, setConfig] = useState({
    auto_join: false,
    allow_user_exit: false,
    record_breakout_sessions: true,
    exp: false,
    expiryTime: 15,
  });

  const handleNewParticipantsState = useCallback((event = null) => {
    switch (event?.action) {
      case 'joined-meeting':
        setRooms((rooms: any) => {
          return {
            ...rooms,
            unassigned: Array.from(
              new Set(rooms.unassigned).add(event.participants.local),
            ),
          };
        });
        break;
      case 'participant-joined':
        setRooms((rooms: any) => {
          return {
            ...rooms,
            unassigned: Array.from(
              new Set(rooms.unassigned).add(event.participant),
            ),
          };
        });
        break;
      case 'participant-updated':
        const participant = event.participant;
        setRooms((rooms: any) => {
          const r = rooms;
          const idx = r.unassigned?.findIndex(
            (p: DailyParticipant) => p.user_id === participant.user_id,
          );
          if (idx >= 0) {
            r.unassigned[idx] = participant;
          } else {
            r.assigned.map((room: any, index: number) => {
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
        setRooms((rooms: any) => {
          const assigned = rooms.assigned;
          assigned.map((room: any, index: number) => {
            assigned[index] = {
              ...rooms.assigned[index],
              participants: [
                ...room?.participants?.filter((p: any) => p.user_id !== idx),
              ],
            };
          });
          return {
            ...rooms,
            assigned,
            unassigned: [
              ...rooms.unassigned.filter((p: any) => p.user_id !== idx),
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
    async (participant, roomIndex = null) => {
      const r = breakoutSession.rooms;
      if (roomIndex) {
        r[roomIndex].participants.push(participant);
        r[roomIndex].participantIds.push(participant.user_id);
      } else {
        const participantsInRooms = r.map((r: any) => r.participants.length);
        const minParticipantRoomIndex = participantsInRooms.indexOf(
          Math.min(...participantsInRooms),
        );
        r[minParticipantRoomIndex].participants.push(participant);
        r[minParticipantRoomIndex].participantIds.push(participant.user_id);
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
        createSession,
        updateSession,
        endSession,
        assignRoomToNewParticipant,
      }}
    >
      {children}
    </BreakoutRoomContext.Provider>
  );
};

export const useBreakoutRoom = () => useContext(BreakoutRoomContext);
