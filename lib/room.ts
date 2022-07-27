import { DailyBreakoutProviderRooms, DailyBreakoutRoom } from '../types/next';

const roomInitialValue = (
  room: string,
  date: Date,
  index: number,
): DailyBreakoutRoom => {
  return {
    name: `Breakout Room ${index}`,
    roomName: `${room}-${index}`,
    created: date,
    participants: [],
  };
};

export const getRoomsInitialValues = (
  room: string,
  date: Date,
  maxRooms: number = 2,
): DailyBreakoutProviderRooms => {
  return {
    assigned: Array.from({ length: maxRooms }, (_, idx) =>
      roomInitialValue(room, date, idx + 1),
    ),
    unassignedParticipants: [],
  };
};
