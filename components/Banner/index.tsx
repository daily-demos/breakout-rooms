import React, { useMemo } from 'react';
import { Pane, Heading, Button } from 'evergreen-ui';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import Timer from '../Timer';

const Banner = () => {
  const { isBreakoutRoom, myBreakoutRoom, breakoutSession, setJoin } = useBreakoutRoom();

  const heading = useMemo(() => {
    if (breakoutSession) {
      if (isBreakoutRoom && myBreakoutRoom?.name) {
        return myBreakoutRoom?.name;
      } else {
        return 'Lobby';
      }
    }
  }, [breakoutSession, isBreakoutRoom, myBreakoutRoom?.name]);

  if (!breakoutSession) return null;

  return (
    <Pane
      background="tint1"
      height="35px"
      display="flex"
      justifyContent="center"
      alignItems="center"
      borderBottom="muted"
    >
      <Heading justifyContent="center">{heading}</Heading>
      {breakoutSession && breakoutSession.config.exp && isBreakoutRoom ? (
        <Pane position="absolute" right={5}>
          <Timer />
        </Pane>
      ) : (
        <Pane position="absolute" right={5}>
          <Button size="small" appearance="primary" onClick={() => setJoin(true)}>
            Join room
          </Button>
        </Pane>
      )}
    </Pane>
  );
};

export default Banner;
