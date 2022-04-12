import { DailyBreakoutProviderRooms } from '../types/next';

export const getRoomsInitialValues = (
  date: Date,
): DailyBreakoutProviderRooms => {
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
