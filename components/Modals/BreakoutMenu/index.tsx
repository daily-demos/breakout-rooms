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
  EmptyState,
  LockIcon,
} from 'evergreen-ui';
import { useBreakoutRoom } from '../../../contexts/BreakoutRoomProvider';
import { useCall } from '../../../contexts/CallProvider';
import {
  useLocalSessionId,
  useParticipantProperty,
} from '@daily-co/daily-react-hooks';

// whenever the breakout session is active we will be showing the following menu to all the participants.
// - it shows the time left, allows you to change and leave room and for owners it will also allow managing rooms.

const BreakoutMenu = () => {
  const { showBreakoutModal, setShowBreakoutModal } = useCall();
  const {
    breakoutSession,
    isBreakoutRoom,
    endSession,
    joinModalStatus,
    setJoin,
    setManage,
    returnToLobby,
  } = useBreakoutRoom();

  const localSessionId = useLocalSessionId();
  const isOwner = useParticipantProperty(localSessionId as string, 'owner');

  const handleJoinRoom = useCallback(() => {
    setShowBreakoutModal(false);
    setJoin(join => !join);
  }, [setJoin, setShowBreakoutModal]);

  const handleManage = () => {
    setShowBreakoutModal(false);
    setManage(manage => !manage);
  };

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
        {joinModalStatus && (
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
            <Text display="grid">Join Breakout</Text>
          </Card>
        )}
        {isBreakoutRoom &&
          breakoutSession?.rooms.length > 1 &&
          breakoutSession?.config.allow_user_switch_room && (
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
              <Text display="grid">Change room</Text>
            </Card>
          )}
        {(isBreakoutRoom || isOwner) && isOwner && (
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
        {(isBreakoutRoom || isOwner) && isOwner && (
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
      {!joinModalStatus && !isBreakoutRoom && (
        <Pane width="auto" height="auto">
          <EmptyState
            title="Breakout session already started"
            orientation="vertical"
            icon={<LockIcon color="#EBAC91" />}
            iconBgColor="#F8E3DA"
            description="You cannot join after the session is started, owner has disabled joining after the session started."
          />
        </Pane>
      )}
    </Dialog>
  );
};

export default BreakoutMenu;
