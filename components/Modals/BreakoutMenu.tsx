import React, { useCallback } from 'react';
import {
  LogOutIcon,
  SettingsIcon,
  SmallCrossIcon,
  LogInIcon,
  Dialog,
  Card,
  Pane,
  Text,
} from 'evergreen-ui';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import { useCall } from '../../contexts/CallProvider';
import { useSocket } from '../../contexts/SocketProvider';

// whenever the breakout session is active we will be showing the following menu to all the participants.
// - it shows the time left, allows you to change and leave room and for owners it will also allow managing rooms.

const BreakoutMenu = () => {
  const { isOwner, joinAs } = useSocket();
  const { showBreakoutModal, setShowBreakoutModal } = useCall();
  const {
    breakoutSession,
    setBreakoutSession,
    showJoinModal,
    setJoin,
    setManage,
  } = useBreakoutRoom();
  const { isBreakoutRoom, endSession } = useBreakoutRoom();

  const handleJoinRoom = useCallback(() => {
    setShowBreakoutModal(false);
    setJoin(join => !join);
  }, [setJoin, setShowBreakoutModal]);

  const returnToLobby = useCallback(() => {
    setShowBreakoutModal(false);
    setBreakoutSession(null);
    joinAs(isOwner, true);
  }, [isOwner, joinAs, setBreakoutSession, setShowBreakoutModal]);

  const handleManage = () => setManage(manage => !manage);

  const endBreakoutSession = useCallback(() => {
    setShowBreakoutModal(false);
    endSession();
  }, [endSession, setShowBreakoutModal]);

  return (
    <Dialog
      isShown={showBreakoutModal}
      hasFooter={false}
      title="Breakout Menu"
      onCloseComplete={() => setShowBreakoutModal(false)}
    >
      <Pane
        display="flex"
        gap={10}
        textAlign="center"
        justifyContent="center"
        paddingBottom={20}
      >
        {(showJoinModal ||
          (isBreakoutRoom && breakoutSession?.rooms.length > 1)) && (
          <Card
            elevation={1}
            border="muted"
            padding={10}
            flexGrow={1}
            width={150}
            cursor="pointer"
            onClick={handleJoinRoom}
          >
            <LogInIcon size={24} marginY={10} />
            <Text display="grid">
              {showJoinModal ? 'Join breakout' : 'Change room'}
            </Text>
          </Card>
        )}
        {isBreakoutRoom && isOwner && (
          <Card
            elevation={1}
            border="muted"
            padding={10}
            flexGrow={1}
            width={150}
            cursor="pointer"
            onClick={handleManage}
          >
            <SettingsIcon size={24} marginY={10} />
            <Text display="grid">Manage Room</Text>
          </Card>
        )}
        {isBreakoutRoom && breakoutSession?.config.allow_user_exit && (
          <Card
            elevation={1}
            border="muted"
            padding={10}
            flexGrow={1}
            width={150}
            cursor="pointer"
            onClick={returnToLobby}
          >
            <LogOutIcon size={24} marginY={10} />
            <Text display="grid">Lobby</Text>
          </Card>
        )}
        {isBreakoutRoom && isOwner && (
          <Card
            elevation={1}
            border="muted"
            padding={10}
            flexGrow={1}
            width={150}
            cursor="pointer"
            onClick={endBreakoutSession}
          >
            <SmallCrossIcon size={24} marginY={10} />
            <Text display="grid">End session</Text>
          </Card>
        )}
      </Pane>
    </Dialog>
  );
};

export default BreakoutMenu;
