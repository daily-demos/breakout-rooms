import React, {
  createContext,
  Dispatch,
  RefObject,
  SetStateAction,
  useCallback,
  useContext,
  useEffect,
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
  roomName: string;
};

interface ContextValue {
  callFrame: DailyCall | null;
  callRef: RefObject<HTMLDivElement> | null;
  isOwner: boolean;
  joinAs: (name: string, isOwner?: boolean, disablePrejoin?: boolean) => void;
  joinCall: (name: string, token?: string, breakout?: boolean) => void;
  room: string;
  setCallFrame: Dispatch<SetStateAction<DailyCall | null>>;
  setShowBreakoutModal: Dispatch<SetStateAction<boolean>>;
  showBreakoutModal: boolean;
}

export const CallContext = createContext<ContextValue>({
  callFrame: null,
  callRef: null,
  isOwner: false,
  joinAs: () => {},
  joinCall: () => {},
  room: '',
  setCallFrame: () => {},
  setShowBreakoutModal: () => {},
  showBreakoutModal: false,
});

export const CallProvider = ({ children, roomName }: CallProviderType) => {
  const callRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<DailyCall | null>(null);
  const [showBreakoutModal, setShowBreakoutModal] = useState<boolean>(false);
  const [room, setRoom] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);

  useEffect(() => {
    if (!roomName) return;

    if (roomName.includes('-')) {
      const splitRoomName = roomName.split('-')[0];
      if (splitRoomName === room) return;
      setRoom(splitRoomName as string);
    } else {
      if (room === roomName) return;
      setRoom(roomName);
    }
  }, [room, roomName]);

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
    (name = roomName, token = '') => {
      const domain = process.env.NEXT_PUBLIC_DAILY_DOMAIN;

      const newCallFrame: DailyCall = DailyIframe.createFrame(
        callRef?.current as unknown as HTMLElement,
        CALL_OPTIONS,
      );
      setCallFrame(newCallFrame as DailyCall);

      const url: string = `https://${domain}.daily.co/${name}`;
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
    [handleCustomButtonClick, handleJoinedMeeting, handleLeftMeeting, roomName],
  );

  const joinAs = useCallback(
    async (name, owner: boolean = false, disablePrejoin: boolean = false) => {
      const body: { [key: string]: string | boolean } = {
        roomName: name,
        isOwner: owner,
        prejoinUI: !disablePrejoin,
      };

      if (disablePrejoin && callFrame) {
        const localUser = await callFrame.participants().local;
        body.username = localUser.user_name;
        body.userId = localUser.user_id;
      }

      const options = {
        method: 'POST',
        body: JSON.stringify(body),
      };
      const res = await fetch('/api/token', options);
      const { token } = await res.json();
      setIsOwner(owner);

      if (disablePrejoin) await callFrame?.destroy();
      await joinCall(room as string, token);
    },
    [callFrame, joinCall, room],
  );

  return (
    <CallContext.Provider
      value={{
        callRef,
        callFrame,
        setCallFrame,
        joinCall,
        joinAs,
        showBreakoutModal,
        setShowBreakoutModal,
        room: room as string,
        isOwner,
      }}>
      <DailyProvider callObject={callFrame as DailyCall}>
        {children}
      </DailyProvider>
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
