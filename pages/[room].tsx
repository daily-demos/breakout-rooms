import React from 'react';
import { useRouter } from 'next/router';
import { CallProvider } from '../contexts/CallProvider';
import { NextPage } from 'next';
import Room from '../components/Room';
import { BreakoutProvider } from '../contexts/BreakoutRoomProvider';

const RoomPage: NextPage = () => {
  const router = useRouter();
  const { room } = router.query;

  return (
    <CallProvider roomName={room as string}>
      <BreakoutProvider>
        <Room />
      </BreakoutProvider>
    </CallProvider>
  );
};

export default RoomPage;
