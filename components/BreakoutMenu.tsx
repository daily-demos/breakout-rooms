import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
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
import { useBreakoutRoom } from '../contexts/BreakoutRoomProvider';
import ManageBreakoutRooms from './ManageBreakoutRooms';
import { useCall } from '../contexts/CallProvider';

type BreakoutMenuType = {
  joinAs: (owner?: boolean, disablePrejoin?: boolean) => void;
  isOwner: boolean;
  setJoin: Dispatch<SetStateAction<boolean>>;
};

// whenever the breakout session is active we will be showing the following menu to all the participants.
// - it shows the time left, allows you to change and leave room and for owners it will also allow managing rooms.

const BreakoutMenu = ({ joinAs, isOwner, setJoin }: BreakoutMenuType) => {
  const { callFrame, setCallFrame, showBreakoutModal, setShowBreakoutModal } =
    useCall();
  const { breakoutSession, setBreakoutSession, showJoinModal } =
    useBreakoutRoom();
  const [manage, setManage] = useState<boolean>(false);
  const { isBreakoutRoom, endSession } = useBreakoutRoom();

  const returnToLobby = useCallback(() => {
    setShowBreakoutModal(false);
    callFrame?.destroy();
    setCallFrame(null);
    setBreakoutSession(null);
    joinAs(isOwner, true);
  }, [
    callFrame,
    isOwner,
    joinAs,
    setBreakoutSession,
    setCallFrame,
    setShowBreakoutModal,
  ]);

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
        {showJoinModal ||
          (isBreakoutRoom && breakoutSession?.rooms.length > 1 && (
            <Card
              elevation={1}
              border="muted"
              padding={10}
              flexGrow={1}
              width={150}
              cursor="pointer"
              onClick={() => setJoin(join => !join)}
            >
              <LogInIcon size={40} marginY={10} />
              <Text display="grid">
                {showJoinModal ? 'Join breakout' : 'Change room'}
              </Text>
            </Card>
          ))}
        {isBreakoutRoom && isOwner && (
          <Card
            elevation={1}
            border="muted"
            padding={10}
            flexGrow={1}
            width={150}
            cursor="pointer"
            onClick={() => setManage(!manage)}
          >
            <SettingsIcon size={40} marginY={10} />
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
            <LogOutIcon size={40} marginY={10} />
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
            <SmallCrossIcon size={40} marginY={10} />
            <Text display="grid">End session</Text>
          </Card>
        )}
      </Pane>
      {manage && <ManageBreakoutRooms isShown={manage} setShown={setManage} />}
    </Dialog>
  );
};

export default BreakoutMenu;
