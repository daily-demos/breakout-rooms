import React from 'react';
import { CallProvider } from '../contexts/CallProvider';
import { BreakoutRoomProvider } from '../contexts/BreakoutRoomProvider';
import { SocketProvider } from '../contexts/SocketProvider';
import Room from '../components/Room';
import { useRouter } from 'next/router';

const RoomPage = () => {
  const router = useRouter();

  const { room } = router.query;
  return (
    <CallProvider roomName={room as string}>
      <BreakoutRoomProvider>
        <SocketProvider>
          <Room />
        </SocketProvider>
      </BreakoutRoomProvider>
    </CallProvider>
  );
};

export default RoomPage;
