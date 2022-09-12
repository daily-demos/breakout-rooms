import React, { useState, useEffect } from 'react';
import { useBreakoutRoom } from '../../contexts/BreakoutRoomProvider';
import { Text } from 'evergreen-ui';

const Timer = () => {
  const [secs, setSecs] = useState<string | null>('--:--');
  const { breakoutSession } = useBreakoutRoom();

  // If room has an expiry time, we'll calculate how many seconds until expiry
  useEffect(() => {
    if (!breakoutSession.config.exp) return;

    const i = setInterval(() => {
      const timeNow = Math.round(new Date().getTime() / 1000);
      let timeLeft =
        (breakoutSession.config.exp as unknown as number) - timeNow;
      if (timeLeft < 0 && breakoutSession.config.exp) {
        return setSecs(null);
      }
      setSecs(
        `${Math.floor(timeLeft / 60)}m:${`0${timeLeft % 60}`.slice(-2)}s`,
      );
    }, 1000);

    return () => clearInterval(i);
  }, [breakoutSession.config.exp]);

  if (!secs) {
    return null;
  }

  return <Text>Ends in {secs}</Text>;
};

export default Timer;
