import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CornerDialog, GridViewIcon } from 'evergreen-ui';
import { io } from 'socket.io-client';
import Head from 'next/head';
import BreakoutModal from '../components/BreakoutModal';
import Timer from '../components/Timer';
import Hero from '../components/Hero';
import { useCall } from '../components/CallProvider';
import BreakoutMenu from '../components/BreakoutMenu';
import equal from 'fast-deep-equal';
import { useBreakoutRoom } from '../components/BreakoutRoomProvider';
import JoinBreakoutModal from '../components/JoinBreakoutModal';
import { DailyParticipant } from '@daily-co/daily-js';
import { DailyBreakoutRoom, DailyBreakoutSession } from '../types/next';

const Room = () => {
  const [warn, setWarn] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [breakoutModal, setBreakoutModal] = useState<boolean>(false);
  const [join, setJoin] = useState<boolean>(false);

  const {
    callRef,
    callFrame,
    joinCall,
    showBreakoutButton,
    setShowBreakoutButton,
  } = useCall();
  const {
    isBreakoutRoom,
    setIsBreakoutRoom,
    breakoutSession,
    setBreakoutSession,
    myBreakoutRoom,
    assignRoomToNewParticipant,
  } = useBreakoutRoom();

  const joinBreakoutRoom = useCallback(
    async (sessionObject: DailyBreakoutSession) => {
      if (!callFrame) return;

      const localUser = await callFrame?.participants().local;

      sessionObject.rooms?.map(async (room: DailyBreakoutRoom) => {
        if (room.participantIds?.includes(localUser?.user_id)) {
          const options = {
            method: 'POST',
            body: JSON.stringify({
              roomName: room.room_url,
              isOwner,
              username: localUser?.user_name,
              userId: localUser?.user_id,
              recordBreakoutRooms:
                sessionObject.config.record_breakout_sessions,
            }),
          };

          const res = await fetch('/api/token', options);
          const { token } = await res.json();
          await callFrame.destroy();
          await joinCall(room.room_url, token, true);
          setWarn(true);
        }
      });
    },
    [callFrame, isOwner, joinCall],
  );

  const joinAs = useCallback(
    async (owner: boolean = false) => {
      const options = {
        method: 'POST',
        body: JSON.stringify({ is_owner: owner }),
      };

      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      setIsOwner(owner);
      await joinCall(process.env.NEXT_PUBLIC_DAILY_ROOM as string, token);
    },
    [joinCall],
  );

  const handleBreakoutSessionStarted = useCallback(
    async (data: { sessionObject: DailyBreakoutSession }) => {
      setIsBreakoutRoom(true);
      setBreakoutSession(data.sessionObject);
      await joinBreakoutRoom(data.sessionObject);
    },
    [joinBreakoutRoom, setBreakoutSession, setIsBreakoutRoom],
  );

  const handleBreakoutSessionUpdated = useCallback(
    async (data: any) => {
      setIsBreakoutRoom(true);
      setBreakoutSession(data.sessionObject);

      const localUser = await callFrame?.participants()?.local;
      if (
        data.newParticipantIds &&
        data.newParticipantIds.includes(localUser?.user_id)
      ) {
        await joinBreakoutRoom(data.sessionObject);
      }
    },
    [callFrame, joinBreakoutRoom, setBreakoutSession, setIsBreakoutRoom],
  );

  const handleBreakoutSessionEnded = useCallback(() => {
    setShowBreakoutButton(false);
    setIsBreakoutRoom(false);
    setBreakoutSession(null);
    setWarn(false);
    callFrame?.destroy();
    joinAs(isOwner);
  }, [
    callFrame,
    isOwner,
    joinAs,
    setBreakoutSession,
    setIsBreakoutRoom,
    setShowBreakoutButton,
  ]);

  const handleBreakoutSessionRequest = useCallback(async () => {
    if (breakoutSession && callFrame) {
      const options = {
        method: 'POST',
        body: JSON.stringify({
          sessionObject: breakoutSession,
          event: 'DAILY_BREAKOUT_SYNC',
        }),
      };

      await fetch('/api/socket', options);
    }
  }, [breakoutSession, callFrame]);

  const handleBreakoutSessionSync = useCallback(
    (data: { sessionObject: DailyBreakoutSession }) => {
      if (equal(data.sessionObject, breakoutSession)) return;
      setBreakoutSession(data.sessionObject);
    },
    [breakoutSession, setBreakoutSession],
  );

  useEffect((): any => {
    const socket = io(process.env.NEXT_PUBLIC_BASE_URL as string, {
      path: '/api/socketio',
    });

    socket.on('connect', () => {
      console.log('SOCKET CONNECTED!', socket.id);
    });

    socket.on('DAILY_BREAKOUT_STARTED', handleBreakoutSessionStarted);
    socket.on('DAILY_BREAKOUT_UPDATED', handleBreakoutSessionUpdated);
    socket.on('DAILY_BREAKOUT_CONCLUDED', handleBreakoutSessionEnded);
    socket.on('DAILY_BREAKOUT_REQUEST', handleBreakoutSessionRequest);
    socket.on('DAILY_BREAKOUT_SYNC', handleBreakoutSessionSync);
    if (socket) return () => socket.disconnect();
  }, [
    callFrame,
    handleBreakoutSessionEnded,
    handleBreakoutSessionRequest,
    handleBreakoutSessionStarted,
    handleBreakoutSessionSync,
    handleBreakoutSessionUpdated,
  ]);

  const showJoinBreakoutRoomModal = useMemo(() => {
    if (!callFrame) return false;

    if (!breakoutSession) return false;
    if (!isBreakoutRoom) return !breakoutSession.config.auto_join;
  }, [callFrame, breakoutSession, isBreakoutRoom]);

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
      {showBreakoutButton && (
        <>
          {!breakoutSession ? (
            isOwner && (
              <button
                type="button"
                className="breakout-button"
                onClick={() => setBreakoutModal(true)}
              >
                <GridViewIcon marginBottom={5} />
                Breakout
              </button>
            )
          ) : (
            <BreakoutMenu
              showJoinBreakoutRoomModal={showJoinBreakoutRoomModal as boolean}
              setShow={setJoin}
              joinAs={joinAs}
              isOwner={isOwner}
            />
          )}
        </>
      )}
      {!breakoutSession && (
        <BreakoutModal show={breakoutModal} setShow={setBreakoutModal} />
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
        :global(.breakout-button) {
          z-index: 10;
          position: fixed;
          bottom: 0.5em;
          right: 5em;
          background-color: transparent;
          color: #000000;
          border: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          cursor: pointer;
          font-size: 12px;
          font-weight: normal;
          line-height: 16px;
          margin: 0;
          text-align: inherit;
        }
        .text-right {
          float: right;
        }
      `}</style>
    </div>
  );
};

export default Room;
