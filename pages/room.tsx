import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { useRouter } from 'next/router';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';
import {
  GridViewIcon,
  SmallCrossIcon,
  LogOutIcon,
  SettingsIcon,
  TimeIcon,
  Popover,
  Position,
  Menu,
} from 'evergreen-ui';
import Head from 'next/head';
import BreakoutModal from '../components/BreakoutModal';
import Pusher from 'pusher-js';
import Timer from '../components/Timer';
import useBreakoutRoom from '../components/useBreakoutRoom';

const CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '100vh',
    width: '100vw',
    aspectRatio: '16 / 9',
    border: '0',
  },
};

const BREAKOUT_CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '96vh',
    width: '100vw',
    aspectRatio: '16 / 9',
    border: '0',
  },
};

const Room = () => {
  const router = useRouter();
  const callRef = useRef<HTMLDivElement>(null);

  const [show, setShow] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [breakoutModal, setBreakoutModal] = useState(false);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const { endSession } = useBreakoutRoom();

  const [breakoutSession, setBreakoutSession] = useState<any>(null);

  const joinCall = useCallback(
    (name = 'forj-breakout', token, userName = null) => {
      const newCallFrame: DailyCall = DailyIframe.createFrame(
        callRef?.current as HTMLElement,
        userName ? BREAKOUT_CALL_OPTIONS : CALL_OPTIONS,
      );

      newCallFrame.setTheme({
        colors: {
          accent: '#286DA8',
          accentText: '#FFFFFF',
          background: '#FFFFFF',
          backgroundAccent: '#FBFCFD',
          baseText: '#000000',
          border: '#EBEFF4',
          mainAreaBg: '#000000',
          mainAreaBgAccent: '#071D3A',
          mainAreaText: '#FFFFFF',
          supportiveText: '#808080',
        },
      });

      setCallFrame(newCallFrame as DailyCall);
      if (userName)
        newCallFrame.join({
          url: `https://harshith.daily.co/${name}`,
          token,
          userName,
        });
      else {
        newCallFrame
          .join({ url: `https://harshith.daily.co/${name}`, token })
          .then(() => {
            localStorage.setItem(
              'main-breakout-user-id',
              newCallFrame.participants().local.user_id,
            );
          });
      }

      const leave = async () => {
        callFrame?.destroy();
        setShow(false);
      };

      newCallFrame.on('joined-meeting', () => setShow(true));
      newCallFrame.on('left-meeting', leave);
      return () => {
        newCallFrame.off('joined-meeting', () => setShow(true));
        newCallFrame.off('left-meeting', leave);
      };
    },
    [callFrame],
  );

  const handleBreakoutSessionStarted = useCallback(
    async (data: any) => {
      if (!callFrame) return;

      const localUser = callFrame.participants().local;
      setBreakoutSession(data.sessionObject);
      data.sessionObject.rooms?.map(async (room: any) => {
        if (room.participants.includes(localUser.user_id)) {
          await callFrame.destroy();
          joinCall(room.room_url, router.query.t || '', localUser.user_name);
        }
      });
    },
    [callFrame, joinCall, router.query.t],
  );

  useEffect(() => {
    if (callFrame) return;

    if (router.isReady) {
      joinCall('forj-breakout', router.query.t || '');
      setIsOwner(!!router.query.t);
      window.history.replaceState(null, '', '/room');
    }
  }, [callFrame, joinCall, router.isReady, router.query]);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY as string, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
    });

    const channel = pusher.subscribe('breakout-rooms');
    channel.bind('DAILY_BREAKOUT_STARTED', handleBreakoutSessionStarted);
    channel.bind('DAILY_BREAKOUT_UPDATED', (data: any) =>
      setBreakoutSession(data),
    );
    channel.bind('DAILY_BREAKOUT_CONCLUDED', () => {
      setBreakoutSession(null);
      callFrame?.destroy();
      setCallFrame(null);
    });
    return () => pusher.unsubscribe('breakout-rooms');
  }, [callFrame, handleBreakoutSessionStarted]);

  const myBreakoutRoom = useMemo(() => {
    if (breakoutSession) {
      const localUserId = localStorage.getItem('main-breakout-user-id');
      // @ts-ignore
      return breakoutSession.rooms.filter((room: any) =>
        room.participants.includes(localUserId),
      )[0];
    }
  }, [breakoutSession]);

  return (
    <div>
      <Head>
        <title>Breakout Rooms</title>
        <meta name="description" content="Breakout Rooms" />
      </Head>
      {breakoutSession && (
        <div className="banner">
          <b>{myBreakoutRoom.name}</b>
          {breakoutSession.config.exp && (
            <span className="text-right">
              <Timer
                expiry={breakoutSession.config.exp}
                callFrame={callFrame}
                setCallFrame={setCallFrame}
              />
            </span>
          )}
        </div>
      )}
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
            <Popover
              content={
                <Menu>
                  <Menu.Group>
                    {breakoutSession.config.exp && (
                      <Menu.Item disabled icon={TimeIcon}>
                        Time left: <Timer expiry={breakoutSession.config.exp} />
                      </Menu.Item>
                    )}
                    {isOwner && (
                      <Menu.Item icon={SettingsIcon}>Manage rooms</Menu.Item>
                    )}
                    {breakoutSession.config.allow_user_exit && (
                      <Menu.Item icon={LogOutIcon}>Return to lobby</Menu.Item>
                    )}
                  </Menu.Group>
                  {isOwner && (
                    <>
                      <Menu.Divider />
                      <Menu.Group>
                        <Menu.Item
                          icon={SmallCrossIcon}
                          intent="danger"
                          onSelect={endSession}
                        >
                          End breakout session
                        </Menu.Item>
                      </Menu.Group>
                    </>
                  )}
                </Menu>
              }
              position={Position.TOP_RIGHT}
            >
              <button type="button" className="breakout-button">
                <GridViewIcon marginBottom={5} />
                Breakout
              </button>
            </Popover>
          )}
        </>
      )}
      <BreakoutModal
        show={breakoutModal}
        setShow={setBreakoutModal}
        call={callFrame as DailyCall}
      />
      <style jsx>{`
        .banner {
          text-align: center;
          height: 4vh;
          padding: 0.5rem;
          background: #eee;
        }
        .breakout-button {
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
