import { Dispatch, useCallback, SetStateAction } from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

const CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '100vh',
    width: '100vw',
    aspectRatio: '16 / 9',
    border: '0',
  },
};

const BREAKOUT_CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '96vh',
    width: '100vw',
    aspectRatio: '16 / 9',
    border: '0',
  },
};

type useCallType = {
  callRef: any;
  callFrame: DailyCall | null;
  setCallFrame: Dispatch<SetStateAction<DailyCall | null>>;
  setShow: Dispatch<SetStateAction<boolean>>;
  setWarn: Dispatch<SetStateAction<boolean>>;
};

const useCall = ({
  callRef,
  callFrame,
  setCallFrame,
  setShow,
  setWarn,
}: useCallType) => {
  const handleJoinedMeeting = useCallback(async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        event: 'DAILY_BREAKOUT_REQUEST',
      }),
    };

    setShow(true);
    await fetch('/api/socket', options);
  }, [setShow]);

  const joinCall = useCallback(
    (
      name = process.env.NEXT_PUBLIC_DAILY_ROOM,
      token = '',
      breakout = false,
    ) => {
      const newCallFrame: DailyCall = DailyIframe.createFrame(
        callRef?.current as HTMLElement,
        breakout ? BREAKOUT_CALL_OPTIONS : CALL_OPTIONS,
      );

      newCallFrame.setTheme({
        colors: {
          accent: '#286DA8',
          accentText: '#FFFFFF',
          background: '#FFFFFF',
          backgroundAccent: '#FBFCFD',
          baseText: '#000000',
          border: '#EBEFF4',
          mainAreaBg: '#000000',
          mainAreaBgAccent: '#071D3A',
          mainAreaText: '#FFFFFF',
          supportiveText: '#808080',
        },
      });

      setCallFrame(newCallFrame as DailyCall);
      if (breakout) {
        newCallFrame.join({ url: `https://harshith.daily.co/${name}`, token });
        setWarn(true);
      } else {
        newCallFrame
          .join({ url: `https://harshith.daily.co/${name}`, token })
          .then(() => {
            localStorage.setItem(
              'main-breakout-user-id',
              newCallFrame.participants().local.user_id,
            );
          });
      }

      const leave = async () => {
        callFrame?.destroy();
        setShow(false);
        setCallFrame(null);
      };

      newCallFrame.on('joined-meeting', handleJoinedMeeting);
      newCallFrame.on('left-meeting', leave);
      return () => {
        newCallFrame.off('joined-meeting', handleJoinedMeeting);
        newCallFrame.off('left-meeting', leave);
      };
    },
    [callFrame, callRef, handleJoinedMeeting, setCallFrame, setShow, setWarn],
  );

  return { joinCall };
};

export default useCall;
