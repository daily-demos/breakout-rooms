import React from 'react';
import Head from 'next/head';
import { useCall } from '../../contexts/CallProvider';
import Hero from '../Hero';
import Banner from '../Banner';
import CreateBreakoutModal from '../Modals/CreateBreakoutModal';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import BreakoutMenu from '../Modals/BreakoutMenu';
import JoinBreakoutModal from '../Modals/JoinRoomModal';

const Room = () => {
  const { callRef, callFrame } = useCall();
  const { breakoutSession, join } = useBreakoutRoom();

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      {!callFrame ? <Hero /> : <Banner />}

      <div ref={callRef} className="room" />

      {callFrame && breakoutSession ? (
        <BreakoutMenu />
      ) : (
        <CreateBreakoutModal />
      )}
      {join && <JoinBreakoutModal />}
    </div>
  );
};

export default Room;
