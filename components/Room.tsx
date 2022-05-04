import React, { useEffect } from 'react';
import { CornerDialog, Position } from 'evergreen-ui';
import Head from 'next/head';
import BreakoutModal from '../components/Modals/BreakoutModal';
import BreakoutMenu from '../components/Modals/BreakoutMenu';
import Timer from '../components/Timer';
import Hero from '../components/Hero';
import { useCall } from '../contexts/CallProvider';
import { useBreakoutRoom } from '../contexts/BreakoutRoomProvider';
import JoinBreakoutModal from '../components/Modals/JoinBreakoutModal';
import { useSocket } from '../contexts/SocketProvider';
import ManageBreakoutRooms from '../components/ManageBreakoutRooms';
import { DailyEventObject } from '@daily-co/daily-js';

const Room = () => {
  const { callRef, callFrame, showChat, setShowChat, room } = useCall();
  const { breakoutSession, myBreakoutRoom, isBreakoutRoom } = useBreakoutRoom();

  const { warn, setWarn } = useSocket();

  useEffect(() => {
    // @ts-ignore
    window.CometChatWidget.init({
      appID: process.env.NEXT_PUBLIC_COMET_CHAT_APP_ID,
      appRegion: process.env.NEXT_PUBLIC_COMET_CHAT_APP_REGION,
      authKey: process.env.NEXT_PUBLIC_COMET_CHAT_APP_AUTH_KEY,
    }).then(
      () => {
        console.log('Initialization completed successfully');
      },
      (error: string) => {
        console.log('Initialization failed with error:', error);
      },
    );
  }, []);

  useEffect(() => {
    if (!callFrame || isBreakoutRoom) return;

    // @ts-ignore
    const CometChatWidget = window.CometChatWidget;

    const handleLeftMeeting = () => {
      setShowChat(false);
      CometChatWidget.logout().then((response: string) => {
        console.log(response);
      });
    };

    const handleJoinedMeeting = (event: DailyEventObject) => {
      const localUser = event.participants.local;

      const uid = localUser.user_id;
      const user = new CometChatWidget.CometChat.User(uid);
      user.setName(localUser.user_name);

      CometChatWidget.createOrUpdateUser(user).then(() => {
        CometChatWidget.login({ uid }).then(
          () => {
            CometChatWidget.launch({
              widgetID: 'fc448e59-d420-4053-ba66-2b76cf524db7',
              target: '#cometchat',
              defaultID: room,
              defaultType: 'group',
            });
          },
          (error: string) => {
            console.log('User login failed with error:', error);
            //Check the reason for error and take appropriate action.
          },
        );
      });
    };

    callFrame.on('joined-meeting', handleJoinedMeeting);
    callFrame.on('left-meeting', handleLeftMeeting);
    return () => {
      callFrame.off('joined-meeting', handleJoinedMeeting);
      callFrame.off('left-meeting', handleLeftMeeting);
    };
  }, [callFrame, isBreakoutRoom, room, setShowChat]);

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

      {!callFrame && <Hero />}

      <div className="flex">
        <div className="room">
          <div ref={callRef} />
        </div>
        <div className="comet-chat">
          <div id="cometchat" style={{ height: '100%' }} />
        </div>
      </div>

      {breakoutSession ? <BreakoutMenu /> : <BreakoutModal />}
      {breakoutSession && <JoinBreakoutModal />}
      {breakoutSession && <ManageBreakoutRooms />}

      <CornerDialog
        title="Muted video & audio"
        isShown={warn}
        onCloseComplete={() => setWarn(false)}
        confirmLabel="Okay"
        onConfirm={() => setWarn(false)}
        hasCancel={false}
        position={Position.BOTTOM_LEFT}
      >
        Video and audio are muted by default on joining the breakout rooms for
        the sake of privacy, you can always turn them on!
      </CornerDialog>
      <style jsx>{`
        .flex {
          display: ${callFrame ? 'flex' : 'hidden'};
          width: 100vw;
          height: ${myBreakoutRoom?.name ? '96vh': '100vh'};
          overflow: hidden;
        }
        .room {
          width: ${showChat ? '75vw' : '100vw'};
        }
        .comet-chat {
          width: ${showChat ? '25vw' : '0'};
        }
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
