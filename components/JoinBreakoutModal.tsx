import React, { Dispatch, SetStateAction } from 'react';
import { Dialog, Heading, Pane, Button, Text } from 'evergreen-ui';
import useBreakoutRoom from './useBreakoutRoom';
import { useCall } from './CallProvider';

type JoinBreakoutModalType = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  breakoutSession: any;
};

const JoinBreakoutModal = ({
  show,
  setShow,
  breakoutSession,
}: JoinBreakoutModalType) => {
  const { callFrame } = useCall();
  const { assignRoomToNewParticipant } = useBreakoutRoom();

  const handleClick = async (index: number) => {
    const participant = await callFrame?.participants().local;
    await assignRoomToNewParticipant(breakoutSession, participant, index);
    setShow(false);
  };

  return (
    <Dialog
      isShown={show}
      title="Join breakout session"
      onCloseComplete={() => setShow(false)}
      hasFooter={false}
    >
      <Pane marginBottom={10}>
        {breakoutSession.rooms.map((room: any, index: number) => (
          <Pane
            display="flex"
            padding={16}
            background="tint2"
            borderRadius={3}
            key={index}
            marginY={10}
          >
            <Pane flex={1}>
              <Heading size={600}>{room.name}</Heading>
              <Text>{room.participants.length} people</Text>
            </Pane>
            <Pane>
              <Button appearance="primary" onClick={() => handleClick(index)}>
                Join
              </Button>
            </Pane>
          </Pane>
        ))}
      </Pane>
    </Dialog>
  );
};

export default JoinBreakoutModal;
