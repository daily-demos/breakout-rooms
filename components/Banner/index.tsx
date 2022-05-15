import React from 'react';
import { Pane, Heading } from 'evergreen-ui';

const Banner = () => {
  return (
    <Pane
      background="tint1"
      height="3.5vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      borderBottom="muted"
    >
      <Heading>Daily Breakout Rooms</Heading>
    </Pane>
  );
};

export default Banner;
