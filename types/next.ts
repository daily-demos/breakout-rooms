import { Server as NetServer, Socket } from 'net';
import { NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { DailyParticipant } from '@daily-co/daily-js';

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
  participants: DailyParticipant[];
  participantIds?: String[];
};

export type DailyBreakoutProviderRooms = {
  assigned: DailyBreakoutRoom[];
  unassignedParticipants: DailyParticipant[];
};

export type DailyBreakoutConfig = {
  auto_join: boolean;
  allow_user_exit: boolean;
  record_breakout_sessions: boolean;
  exp: boolean;
  expiryTime?: number | null;
  max_participants?: boolean;
  max_participants_count?: number;
};

export type DailyBreakoutSession = {
  rooms: DailyBreakoutRoom[];
  config: DailyBreakoutConfig;
};
