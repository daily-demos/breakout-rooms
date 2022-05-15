import React from 'react';
import Head from 'next/head';
import { useCall } from '../../contexts/CallProvider';
import Hero from '../Hero';
import Banner from '../Banner';

const Room = () => {
  const { callRef, callFrame } = useCall();

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      {!callFrame ? <Hero /> : <Banner />}

      <div ref={callRef} className="room" />
    </div>
  );
};

export default Room;
