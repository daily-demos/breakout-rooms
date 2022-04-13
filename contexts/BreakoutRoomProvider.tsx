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
import { useDailyEvent } from '@daily-co/daily-react-hooks';
import BreakoutRoom from './BreakoutRoom';

interface ContextValue {
  breakout: any;
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
}

// @ts-ignore
export const BreakoutRoomContext = createContext<ContextValue>(null);

type BreakoutRoomProviderType = {
  children: React.ReactNode;
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

  const breakout: any = new BreakoutRoom(callFrame);

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
    const { breakoutSession, myBreakoutRoom } =
      breakout.startSession(properties);
    setMyRoom(myBreakoutRoom);

    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject: breakoutSession,
        event: 'DAILY_BREAKOUT_STARTED',
      }),
    };

    const res = await fetch('/api/socket', options);
    const { status } = await res.json();
    return status;
  };

  const updateSession = async (breakoutSession: DailyBreakoutSession) => {
    const { breakoutSession: sessionObject } =
      breakout.updateSession(breakoutSession);

    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject,
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
    setRooms(getRoomsInitialValues(new Date()));

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
