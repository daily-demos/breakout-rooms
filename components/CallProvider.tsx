import React, {
  Dispatch,
  useCallback,
  SetStateAction,
  useState,
  useRef,
  createContext,
  useContext,
} from 'react';
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

type CallProviderType = {
  children: React.ReactNode;
};

interface ContextValue {
  callRef: any;
  callFrame: DailyCall | null;
  setCallFrame: Dispatch<SetStateAction<DailyCall | null>>;
  joinCall: (name: string, token?: string, breakout?: boolean) => void;
  showBreakoutButton: boolean;
  setShowBreakoutButton: Dispatch<SetStateAction<boolean>>;
}

// @ts-ignore
export const CallContext = createContext<ContextValue>(null);

export const CallProvider = ({ children }: CallProviderType) => {
  const callRef = useRef<HTMLDivElement>();
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [showBreakoutButton, setShowBreakoutButton] = useState<boolean>(false);

  const handleLeftMeeting = useCallback(() => {
    setShowBreakoutButton(false);
    localStorage.removeItem('main-breakout-user-id');
    callFrame?.destroy();
    setCallFrame(null);
  }, [callFrame]);

  const handleJoinedMeeting = useCallback(async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        event: 'DAILY_BREAKOUT_REQUEST',
      }),
    };

    setShowBreakoutButton(true);
    await fetch('/api/socket', options);
  }, []);

  const joinCall = useCallback(
    (
      name = process.env.NEXT_PUBLIC_DAILY_ROOM,
      token = '',
      breakout = false,
    ) => {
      const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;

      const newCallFrame: DailyCall = DailyIframe.createFrame(
        callRef?.current as unknown as HTMLElement,
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

      newCallFrame
        .join({ url: `https://${domain}.daily.co/${name}`, token })
        .then(() => {
          if (!breakout) {
            localStorage.setItem(
              'main-breakout-user-id',
              newCallFrame.participants().local.user_id,
            );
          }
        });

      newCallFrame.on('joined-meeting', handleJoinedMeeting);
      newCallFrame.on('left-meeting', handleLeftMeeting);
      return () => {
        newCallFrame.off('joined-meeting', handleJoinedMeeting);
        newCallFrame.off('left-meeting', handleLeftMeeting);
      };
    },
    [handleJoinedMeeting, handleLeftMeeting],
  );

  return (
    <CallContext.Provider
      value={{
        callRef,
        callFrame,
        setCallFrame,
        joinCall,
        showBreakoutButton,
        setShowBreakoutButton,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
