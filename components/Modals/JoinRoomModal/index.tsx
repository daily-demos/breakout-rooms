import React, { useEffect, useState } from 'react';
import { Dialog, Heading, Pane, Button } from 'evergreen-ui';
import { useBreakoutRoom } from '../../../contexts/BreakoutRoomProvider';
import { DailyParticipant } from '@daily-co/daily-js';
import { DailyBreakoutRoom } from '../../../types/next';
import Avatars from './Avatars';
import { useCall } from '../../../contexts/CallProvider';

const JoinBreakoutModal = () => {
  const {
    join: show,
    setJoin: setShow,
    myBreakoutRoom,
    isBreakoutRoom,
  } = useBreakoutRoom();
  const { callFrame } = useCall();
  const [presence, setPresence] = useState<any>({});
  const { breakoutSession, assignRoomToNewParticipant } = useBreakoutRoom();
  const localParticipant = callFrame?.participants().local;

  const handleClick = async (roomName: string) => {
    assignRoomToNewParticipant(localParticipant as DailyParticipant, roomName);
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
      title={isBreakoutRoom ? 'Change breakout room' : 'Join breakout room'}
      onCloseComplete={() => setShow(false)}
      hasFooter={false}
    >
      <Pane marginBottom={10}>
        {breakoutSession?.rooms.map((room: DailyBreakoutRoom) => (
          <Pane key={room.roomName}>
            {myBreakoutRoom?.name !== room.name && (
              <Pane
                display="flex"
                padding={16}
                background="tint2"
                borderRadius={3}
                marginY={10}
                alignItems="center"
              >
                <Pane flex={1}>
                  <Heading size={600}>{room.name}</Heading>
                  <Avatars participants={presence[room.roomName]} />
                </Pane>
                <Pane>
                  <Button
                    appearance="primary"
                    onClick={() => handleClick(room.roomName)}
                  >
                    Join
                  </Button>
                </Pane>
              </Pane>
            )}
          </Pane>
        ))}
      </Pane>
    </Dialog>
  );
};

export default JoinBreakoutModal;
