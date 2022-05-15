import React from 'react';
import { useRouter } from 'next/router';
import { CallProvider } from '../contexts/CallProvider';
import { NextPage } from 'next';
import Room from '../components/Room';

const RoomPage: NextPage = () => {
  const router = useRouter();
  const { room } = router.query;

  return (
    <CallProvider roomName={room as string}>
      <Room />
    </CallProvider>
  );
};

export default RoomPage;
