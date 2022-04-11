import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import DailyIframe, { DailyCall } from '@daily-co/daily-js';

const getCallConfig = (isBreakoutRoom: boolean) => {
  return {
    showLeaveButton: true,
    iframeStyle: {
      height: isBreakoutRoom ? '96vh' : '100vh',
      width: '100vw',
      aspectRatio: '16 / 9',
      border: '0',
    },
    customTrayButtons: {
      breakout: {
        iconPath: `${process.env.NEXT_PUBLIC_BASE_URL}assets/breakout.svg`,
        label: 'Breakout',
        tooltip: 'Breakout rooms',
      },
    },
  };
};

type CallProviderType = {
  children: React.ReactNode;
};

interface ContextValue {
  callRef: any;
  callFrame: DailyCall | null;
  setCallFrame: Dispatch<SetStateAction<DailyCall | null>>;
  joinCall: (name: string, token?: string, breakout?: boolean) => void;
  showBreakoutModal: boolean;
  setShowBreakoutModal: Dispatch<SetStateAction<boolean>>;
}

// @ts-ignore
export const CallContext = createContext<ContextValue>(null);

export const CallProvider = ({ children }: CallProviderType) => {
  const callRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [showBreakoutModal, setShowBreakoutModal] = useState<boolean>(false);

  const handleLeftMeeting = useCallback(() => {
    if (callFrame) callFrame.destroy();
    setCallFrame(null);
  }, [callFrame]);

  const handleJoinedMeeting = useCallback(async () => {
    const options = {
      method: 'POST',
      body: JSON.stringify({
        event: 'DAILY_BREAKOUT_REQUEST',
      }),
    };

    await fetch('/api/socket', options);
  }, []);

  const handleCustomButtonClick = useCallback(event => {
    if (event.button_id === 'breakout') {
      setShowBreakoutModal(button => !button);
    }
  }, []);

  const joinCall = useCallback(
    (
      name = process.env.NEXT_PUBLIC_DAILY_ROOM_NAME,
      token = '',
      breakout = false,
    ) => {
      const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;
      const callOptions = getCallConfig(breakout);

      const newCallFrame: DailyCall = DailyIframe.createFrame(
        callRef?.current as unknown as HTMLElement,
        callOptions,
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

      const url: string = `https://${domain}.staging.daily.co/${name}`;
      newCallFrame.join({ url, token });

      newCallFrame.on('joined-meeting', handleJoinedMeeting);
      newCallFrame.on('left-meeting', handleLeftMeeting);
      newCallFrame.on('custom-button-click', handleCustomButtonClick);
      return () => {
        newCallFrame.off('joined-meeting', handleJoinedMeeting);
        newCallFrame.off('left-meeting', handleLeftMeeting);
        newCallFrame.off('custom-button-click', handleCustomButtonClick);
      };
    },
    [handleCustomButtonClick, handleJoinedMeeting, handleLeftMeeting],
  );

  return (
    <CallContext.Provider
      value={{
        callRef,
        callFrame,
        setCallFrame,
        joinCall,
        showBreakoutModal,
        setShowBreakoutModal,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
