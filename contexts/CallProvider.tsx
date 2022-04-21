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
import { DailyProvider } from '@daily-co/daily-react-hooks';

const CALL_OPTIONS = {
  showLeaveButton: true,
  iframeStyle: {
    height: '96vh',
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
  theme: {
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
  showBreakoutModal: boolean;
  setShowBreakoutModal: Dispatch<SetStateAction<boolean>>;
}

// @ts-ignore
export const CallContext = createContext<ContextValue>(null);

export const CallProvider = ({ children }: CallProviderType) => {
  const callRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [showBreakoutModal, setShowBreakoutModal] = useState<boolean>(false);

  const handleLeftMeeting = useCallback(() => setCallFrame(null), []);

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
      setShowBreakoutModal(show => !show);
    }
  }, []);

  const joinCall = useCallback(
    (
      name = process.env.NEXT_PUBLIC_DAILY_ROOM_NAME,
      token = '',
      exists = false,
    ) => {
      let newCallFrame: DailyCall;
      const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;

      const url: string = `https://${domain}.staging.daily.co/${name}`;

      if (exists) {
        const url: string = `https://${domain}.staging.daily.co/${name}`;
        callFrame?.join({ url, token });
        setCallFrame(callFrame);
      } else {
        newCallFrame = DailyIframe.createFrame(
          callRef?.current as unknown as HTMLElement,
          CALL_OPTIONS,
        );
        setCallFrame(newCallFrame as DailyCall);

        newCallFrame.join({ url, token });

        newCallFrame.on('joined-meeting', handleJoinedMeeting);
        newCallFrame.on('left-meeting', handleLeftMeeting);
        newCallFrame.on('custom-button-click', handleCustomButtonClick);
        return () => {
          newCallFrame.off('joined-meeting', handleJoinedMeeting);
          newCallFrame.off('left-meeting', handleLeftMeeting);
          newCallFrame.off('custom-button-click', handleCustomButtonClick);
        };
      }
    },
    [
      callFrame,
      handleCustomButtonClick,
      handleJoinedMeeting,
      handleLeftMeeting,
    ],
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
      <DailyProvider callObject={callFrame}>{children}</DailyProvider>
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
