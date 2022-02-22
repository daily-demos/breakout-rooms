import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { DailyCall } from '@daily-co/daily-js';

type TimerType = {
  expiry: number;
  callFrame?: DailyCall | null;
  setCallFrame?: Dispatch<SetStateAction<DailyCall | null>>;
};

const Timer = ({ expiry, callFrame, setCallFrame }: TimerType) => {
  const [secs, setSecs] = useState<any>('--:--');

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
        if (callFrame && setCallFrame) {
          await callFrame.leave();
          await callFrame.destroy();
          setCallFrame(null);
        }
        return setSecs(null);
      }
      setSecs(
        `${Math.floor(timeLeft / 60)}m:${`0${timeLeft % 60}`.slice(-2)}s`,
      );
    }, 1000);

    return () => clearInterval(i);
  }, [callFrame, expiry, setCallFrame]);

  if (!secs) {
    return null;
  }

  return secs;
};

export default Timer;
