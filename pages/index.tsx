import React, { useEffect, useState } from 'react';
import { CornerDialog } from 'evergreen-ui';
import Head from 'next/head';
import BreakoutModal from '../components/Modals/BreakoutModal';
import BreakoutMenu from '../components/Modals/BreakoutMenu';
import Timer from '../components/Timer';
import Hero from '../components/Hero';
import { useCall } from '../contexts/CallProvider';
import { useBreakoutRoom } from '../contexts/BreakoutRoomProvider';
import JoinBreakoutModal from '../components/Modals/JoinBreakoutModal';
import { DailyParticipant } from '@daily-co/daily-js';
import { useSocket } from '../contexts/SocketProvider';

const Room = () => {
  const [join, setJoin] = useState<boolean>(false);

  const { callRef, callFrame } = useCall();
  const {
    isBreakoutRoom,
    breakoutSession,
    myBreakoutRoom,
    assignRoomToNewParticipant,
  } = useBreakoutRoom();

  const { isOwner, warn, setWarn, joinAs } = useSocket();

  useEffect(() => {
    if (!callFrame) return;

    const assignParticipant = async () => {
      if (breakoutSession?.config.auto_join) {
        const localUser = await callFrame.participants().local;
        assignRoomToNewParticipant(localUser as DailyParticipant);
      } else setJoin(true);
    };

    if (!breakoutSession) return;
    if (!isBreakoutRoom) assignParticipant();
  }, [assignRoomToNewParticipant, isBreakoutRoom, breakoutSession, callFrame]);

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>

      {callFrame && breakoutSession && myBreakoutRoom?.name && (
        <div className="banner">
          <b>{myBreakoutRoom?.name}</b>
          {breakoutSession.config.exp && (
            <span className="text-right">
              <Timer
                expiry={breakoutSession?.config.exp as unknown as number}
              />
            </span>
          )}
        </div>
      )}
      {!callFrame && <Hero joinAs={joinAs} />}

      <div ref={callRef} className="room" />

      {breakoutSession ? (
        <BreakoutMenu joinAs={joinAs} isOwner={isOwner} setJoin={setJoin} />
      ) : (
        <BreakoutModal isOwner={isOwner} />
      )}
      {breakoutSession && <JoinBreakoutModal show={join} setShow={setJoin} />}
      <CornerDialog
        title="Muted video & audio"
        isShown={warn}
        onCloseComplete={() => setWarn(false)}
        confirmLabel="Okay"
        onConfirm={() => setWarn(false)}
        hasCancel={false}
      >
        Video and audio are muted by default on joining the breakout rooms for
        the sake of privacy, you can always turn them on!
      </CornerDialog>
      <style jsx>{`
        .banner {
          text-align: center;
          height: 4vh;
          padding: 0.5rem;
          background: #eee;
        }
        .text-right {
          float: right;
        }
      `}</style>
    </div>
  );
};

export default Room;
