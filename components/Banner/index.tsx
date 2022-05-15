import React from 'react';
import { Pane, Heading } from 'evergreen-ui';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import Timer from '../Timer';

const Banner = () => {
  const { isBreakoutRoom, myBreakoutRoom, breakoutSession } = useBreakoutRoom();
  return (
    <Pane
      background="tint1"
      height="3.5vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      borderBottom="muted"
    >
      <Heading justifyContent="center">
        {isBreakoutRoom ? myBreakoutRoom?.name : 'Daily Breakout Rooms'}
      </Heading>
      {breakoutSession && breakoutSession.config.exp && (
        <Pane position="absolute" right={5}>
          <Timer />
        </Pane>
      )}
    </Pane>
  );
};

export default Banner;
