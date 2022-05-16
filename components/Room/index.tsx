import React, { useState } from 'react';
import Head from 'next/head';
import { useCall } from '../../contexts/CallProvider';
import Hero from '../Hero';
import Banner from '../Banner';
import CreateBreakoutModal from '../Modals/CreateBreakoutModal';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import BreakoutMenu from '../Modals/BreakoutMenu';
import JoinBreakoutModal from '../Modals/JoinRoomModal';
import ManageBreakoutRooms from '../Modals/ManageBreakout';
import { CornerDialog } from 'evergreen-ui';

const Room = () => {
  const { callRef, callFrame } = useCall();
  const { breakoutSession, join, isBreakoutRoom, warn, setWarn } =
    useBreakoutRoom();

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
      {breakoutSession && isBreakoutRoom && <ManageBreakoutRooms />}

      <CornerDialog
        title="You are muted"
        isShown={warn}
        onCloseComplete={() => setWarn(false)}
        confirmLabel="Okay"
        onConfirm={() => setWarn(false)}
        hasCancel={false}
      >
        On joining a breakout session, your video and audio are muted by default - you can always unmute yourself.
      </CornerDialog>
    </div>
  );
};

export default Room;
