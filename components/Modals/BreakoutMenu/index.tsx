import React, { useCallback, useMemo } from 'react';
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
import { useBreakoutRoom } from '../../../contexts/BreakoutRoomProvider';
import { useCall } from '../../../contexts/CallProvider';

// whenever the breakout session is active we will be showing the following menu to all the participants.
// - it shows the time left, allows you to change and leave room and for owners it will also allow managing rooms.

const BreakoutMenu = () => {
  const { callFrame, showBreakoutModal, setShowBreakoutModal, room, joinAs } =
    useCall();
  const {
    breakoutSession,
    setBreakoutSession,
    isBreakoutRoom,
    setIsBreakoutRoom,
    endSession,
    joinModalStatus,
    setJoin,
    setManage,
  } = useBreakoutRoom();

  const localParticipant = callFrame?.participants().local;
  const isOwner = useMemo(
    () => localParticipant?.owner,
    [localParticipant?.owner],
  );

  const handleJoinRoom = useCallback(() => {
    setShowBreakoutModal(false);
    setJoin(join => !join);
  }, [setJoin, setShowBreakoutModal]);

  const returnToLobby = useCallback(() => {
    setShowBreakoutModal(false);
    setIsBreakoutRoom(false);
    setBreakoutSession(null);
    joinAs(room, isOwner, true);
  }, [
    isOwner,
    joinAs,
    room,
    setBreakoutSession,
    setIsBreakoutRoom,
    setShowBreakoutModal,
  ]);

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
        {(joinModalStatus ||
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
              {joinModalStatus ? 'Join breakout' : 'Change room'}
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
