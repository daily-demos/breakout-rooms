import React, { useState, useEffect } from 'react';
import { useBreakoutRoom } from '../contexts/BreakoutRoomProvider';

type TimerType = {
  expiry: number;
};

const Timer = ({ expiry }: TimerType) => {
  const [secs, setSecs] = useState<any>('--:--');
  const { endSession } = useBreakoutRoom();

  // If room has an expiry time, we'll calculate how many seconds until expiry
  // @ts-ignore
  useEffect(() => {
    if (!expiry) {
      return false;
    }
    const i = setInterval(async () => {
      const timeNow = Math.round(new Date().getTime() / 1000);
      let timeLeft = expiry - timeNow;
      if (timeLeft < 0) {
        endSession();
        return setSecs(null);
      }
      setSecs(
        `${Math.floor(timeLeft / 60)}m:${`0${timeLeft % 60}`.slice(-2)}s`,
      );
    }, 1000);

    return () => clearInterval(i);
  }, [endSession, expiry]);

  if (!secs) {
    return null;
  }

  return secs;
};

export default Timer;
