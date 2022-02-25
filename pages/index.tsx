import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { DailyCall } from '@daily-co/daily-js';
import { GridViewIcon, CornerDialog } from 'evergreen-ui';
import { io } from 'socket.io-client';
import Head from 'next/head';
import BreakoutModal from '../components/BreakoutModal';
import Timer from '../components/Timer';
import Hero from '../components/Hero';
import useCall from '../components/useCall';
import BreakoutMenu from '../components/BreakoutMenu';
import equal from 'fast-deep-equal';
import useBreakoutRoom from '../components/useBreakoutRoom';

const Room = () => {
  const callRef = useRef<HTMLDivElement>(null);

  const [show, setShow] = useState<boolean>(false);
  const [warn, setWarn] = useState<boolean>(false);
  const [isOwner, setIsOwner] = useState(false);
  const [breakout, setBreakout] = useState(false);
  const [breakoutModal, setBreakoutModal] = useState(false);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [breakoutSession, setBreakoutSession] = useState<any>(null);

  const { joinCall } = useCall({
    callRef,
    callFrame,
    setCallFrame,
    setShow,
    setWarn,
  });
  const { assignRoomToNewParticipant } = useBreakoutRoom();

  const joinBreakoutRoom = useCallback(
    async (sessionObject: any) => {
      if (!callFrame) return;

      const localUser = await callFrame.participants().local;
      sessionObject.rooms?.map(async (room: any) => {
        if (room.participantIds.includes(localUser.user_id)) {
          const options = {
            method: 'POST',
            body: JSON.stringify({
              roomName: room.room_url,
              isOwner,
              username: localUser.user_name,
              recordBreakoutRooms:
                sessionObject.config.record_breakout_sessions,
            }),
          };

          const res = await fetch('/api/token', options);
          const { token } = await res.json();
          await callFrame.destroy();
          joinCall(room.room_url, token, true);
        }
      });
    },
    [callFrame, isOwner, joinCall],
  );

  const handleBreakoutSessionStarted = useCallback(
    async (data: any) => {
      setBreakout(true);
      setBreakoutSession(data.sessionObject);
      await joinBreakoutRoom(data.sessionObject);
    },
    [joinBreakoutRoom],
  );

  const handleBreakoutSessionUpdated = useCallback(
    async (data: any) => {
      setBreakout(true);
      setBreakoutSession(data.sessionObject);
      if (
        data.newParticipantIds &&
        data.newParticipantIds.includes(
          localStorage.getItem('main-breakout-user-id'),
        )
      ) {
        await joinBreakoutRoom(data.sessionObject);
      }
    },
    [joinBreakoutRoom],
  );

  const handleBreakoutSessionRequest = useCallback(async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        sessionObject: breakoutSession,
        event: 'DAILY_BREAKOUT_SYNC',
      }),
    };

    await fetch('/api/socket', options);
  }, [breakoutSession]);

  const handleBreakoutSessionSync = useCallback(
    (data: any) => {
      if (equal(data.sessionObject, breakoutSession)) return;
      setBreakoutSession(data.sessionObject);
    },
    [breakoutSession],
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
      joinCall(process.env.NEXT_PUBLIC_DAILY_ROOM, token);
    },
    [joinCall],
  );

  useEffect((): any => {
    const socket = io({ path: '/api/socketio' });

    socket.on('connect', () => {
      console.log('SOCKET CONNECTED!', socket.id);
    });

    socket.on('DAILY_BREAKOUT_STARTED', handleBreakoutSessionStarted);
    socket.on('DAILY_BREAKOUT_UPDATED', handleBreakoutSessionUpdated);
    socket.on('DAILY_BREAKOUT_CONCLUDED', () => {
      setBreakout(false);
      setBreakoutSession(null);
      setWarn(false);
      callFrame?.destroy();
      joinAs(isOwner);
    });
    socket.on('DAILY_BREAKOUT_REQUEST', handleBreakoutSessionRequest);
    socket.on('DAILY_BREAKOUT_SYNC', handleBreakoutSessionSync);
    if (socket) return () => socket.disconnect();
  }, [
    callFrame,
    handleBreakoutSessionRequest,
    handleBreakoutSessionStarted,
    handleBreakoutSessionSync,
    handleBreakoutSessionUpdated,
    isOwner,
    joinAs,
  ]);

  useEffect(() => {
    if (!callFrame) return;

    const assignParticipant = async () => {
      const participant = await callFrame.participants().local;
      await assignRoomToNewParticipant(breakoutSession, participant);
    };

    if (!breakoutSession) return;
    if (!breakout) assignParticipant();
  }, [assignRoomToNewParticipant, breakout, breakoutSession, callFrame]);

  const myBreakoutRoom = useMemo(() => {
    if (breakoutSession) {
      const localUserId = localStorage.getItem('main-breakout-user-id');
      // @ts-ignore
      return breakoutSession.rooms.filter((room: any) =>
        room.participantIds.includes(localUserId),
      )[0];
    } else return null;
  }, [breakoutSession]);

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>
      {callFrame && breakoutSession && (
        <div className="banner">
          <b>{myBreakoutRoom?.name}</b>
          {breakoutSession.config.exp && (
            <span className="text-right">
              <Timer expiry={breakoutSession.config.exp} />
            </span>
          )}
        </div>
      )}
      {!callFrame && <Hero joinAs={joinAs} />}
      <div ref={callRef} className="room" />
      {show && (
        <>
          {!breakoutSession ? (
            <button
              type="button"
              className="breakout-button"
              onClick={() => setBreakoutModal(true)}
            >
              <GridViewIcon marginBottom={5} />
              Breakout
            </button>
          ) : (
            <BreakoutMenu
              breakoutSession={breakoutSession}
              setBreakoutSession={setBreakoutSession}
              joinAs={joinAs}
              isOwner={isOwner}
              callFrame={callFrame}
              setCallFrame={setCallFrame}
            />
          )}
        </>
      )}
      <BreakoutModal
        show={breakoutModal}
        setShow={setBreakoutModal}
        call={callFrame as DailyCall}
      />
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
