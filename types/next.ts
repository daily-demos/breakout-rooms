import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export type DailyBreakoutRoom = {
  name: string;
  roomName: string;
  created: Date;
  participantIds: string[];
};

export type DailyBreakoutProviderRooms = {
  assigned: DailyBreakoutRoom[];
  unassignedParticipants: string[];
};

export type DailyBreakoutConfig = {
  auto_join: boolean;
  allow_user_exit: boolean;
  record_breakout_sessions: boolean;
  exp: boolean | number | null;
  expiryTime?: number | null;
  max_participants?: boolean;
  max_participants_count?: number;
  allow_user_switch_room: boolean;
};

export type DailyBreakoutSession = {
  rooms: DailyBreakoutRoom[];
  config: DailyBreakoutConfig;
};
