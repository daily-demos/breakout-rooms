import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Dialog, Heading, Pane, Button, Text } from 'evergreen-ui';
import { useBreakoutRoom } from './BreakoutRoomProvider';
import { useCall } from './CallProvider';
import { DailyParticipant } from '@daily-co/daily-js';
import { DailyBreakoutRoom } from '../types/next';
import Avatars from './Avatars';

type JoinBreakoutModalType = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
};

const JoinBreakoutModal = ({ show, setShow }: JoinBreakoutModalType) => {
  const { callFrame } = useCall();
  const [presence, setPresence] = useState<any>({});
  const { breakoutSession, assignRoomToNewParticipant } = useBreakoutRoom();

  const handleClick = async (index: number) => {
    const participant = await callFrame?.participants().local;
    assignRoomToNewParticipant(participant as DailyParticipant, index);
    setShow(false);
  };

  useEffect(() => {
    const fetchPresenceData = async () => {
      const res = await fetch('/api/presence');
      const resData = await res.json();
      setPresence(resData);
    };
    fetchPresenceData();
  }, []);

  return (
    <Dialog
      isShown={show}
      title="Join breakout session"
      onCloseComplete={() => setShow(false)}
      hasFooter={false}
    >
      <Pane marginBottom={10}>
        {breakoutSession?.rooms.map(
          (room: DailyBreakoutRoom, index: number) => (
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
                <Avatars participants={presence[room.room_url]} />
              </Pane>
              <Pane>
                <Button appearance="primary" onClick={() => handleClick(index)}>
                  Join
                </Button>
              </Pane>
            </Pane>
          ),
        )}
      </Pane>
    </Dialog>
  );
};

export default JoinBreakoutModal;
