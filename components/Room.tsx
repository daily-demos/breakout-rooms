import React, { useEffect } from 'react';
import { CornerDialog, SideSheet } from 'evergreen-ui';
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

const Room = () => {
  const { callRef, callFrame, showChat, setShowChat } = useCall();
  const { breakoutSession, myBreakoutRoom } = useBreakoutRoom();

  const { warn, setWarn } = useSocket();

  useEffect(() => {
    if (!callFrame || !showChat) return;

    // @ts-ignore
    const CometChatWidget = window.CometChatWidget;

    CometChatWidget.init({
      appID: process.env.NEXT_PUBLIC_COMET_CHAT_APP_ID,
      appRegion: process.env.NEXT_PUBLIC_COMET_CHAT_APP_REGION,
      authKey: process.env.NEXT_PUBLIC_COMET_CHAT_APP_AUTH_KEY,
    }).then(
      () => {
        console.log('Initialization completed successfully');

        const localUser = callFrame.participants().local;
        const uid = localUser.user_id;
        const user = new CometChatWidget.CometChat.User(uid);
        user.setName(localUser.user_name);

        CometChatWidget.createOrUpdateUser(user).then(() => {
          CometChatWidget.login({ uid }).then(
            () => {
              CometChatWidget.launch({
                widgetID: '3e082756-a30e-47d3-a93e-4fb170fad19f',
                target: '#cometchat',
                height: '100vh',
                width: '100%',
                defaultID: 'supergroup', //default UID (user) or GUID (group) to show,
                defaultType: 'group', //user or group
              });
            },
            (error: string) => {
              console.log('User login failed with error:', error);
              //Check the reason for error and take appropriate action.
            },
          );
        });
      },
      (error: string) => {
        console.log('Initialization failed with error:', error);
        //Check the reason for error and take appropriate action.
      },
    );
  }, [callFrame, showChat]);

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

      <div ref={callRef} className="room" />

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
      >
        Video and audio are muted by default on joining the breakout rooms for
        the sake of privacy, you can always turn them on!
      </CornerDialog>
      <SideSheet
        isShown={showChat}
        onCloseComplete={() => setShowChat(false)}
        preventBodyScrolling
      >
        <div id="cometchat" />
      </SideSheet>
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
