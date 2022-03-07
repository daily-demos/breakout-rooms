import React, { Dispatch, SetStateAction, useState } from 'react';
import {
  GridViewIcon,
  LogOutIcon,
  Menu,
  Popover,
  Position,
  SettingsIcon,
  SmallCrossIcon,
  TimeIcon,
  LogInIcon,
} from 'evergreen-ui';
import Timer from './Timer';
import useBreakoutRoom from './useBreakoutRoom';
import ManageBreakoutRooms from './ManageBreakoutRooms';
import { useCall } from './CallProvider';

type BreakoutMenuType = {
  showJoinBreakoutRoomModal: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  breakoutSession: any;
  setBreakoutSession: Dispatch<SetStateAction<any>>;
  joinAs: (owner?: boolean) => void;
  isOwner: boolean;
};

const BreakoutMenu = ({
  showJoinBreakoutRoomModal,
  setShow,
  breakoutSession,
  setBreakoutSession,
  joinAs,
  isOwner,
}: BreakoutMenuType) => {
  const { callFrame, setCallFrame } = useCall();
  const [manage, setManage] = useState<boolean>(false);
  const { endSession } = useBreakoutRoom();

  return (
    <>
      <Popover
        content={
          <Menu>
            <Menu.Group>
              {breakoutSession.config.exp && (
                <Menu.Item disabled icon={TimeIcon}>
                  Time left: <Timer expiry={breakoutSession.config.exp} />
                </Menu.Item>
              )}
              {showJoinBreakoutRoomModal && (
                <Menu.Item icon={LogInIcon} onSelect={() => setShow(true)}>
                  Join breakout room
                </Menu.Item>
              )}
              {isOwner && (
                <Menu.Item
                  icon={SettingsIcon}
                  onSelect={() => setManage(!manage)}
                >
                  Manage rooms
                </Menu.Item>
              )}
              {breakoutSession.config.allow_user_exit && (
                <Menu.Item
                  icon={LogOutIcon}
                  onSelect={() => {
                    callFrame?.destroy();
                    setCallFrame(null);
                    setBreakoutSession(null);
                    joinAs(isOwner);
                  }}
                >
                  Return to lobby
                </Menu.Item>
              )}
            </Menu.Group>
            {isOwner && (
              <>
                <Menu.Divider />
                <Menu.Group>
                  <Menu.Item
                    icon={SmallCrossIcon}
                    intent="danger"
                    onSelect={endSession}
                  >
                    End breakout session
                  </Menu.Item>
                </Menu.Group>
              </>
            )}
          </Menu>
        }
        position={Position.TOP_RIGHT}
      >
        <button type="button" className="breakout-button">
          <GridViewIcon marginBottom={5} />
          Breakout
        </button>
      </Popover>
      {manage && (
        <ManageBreakoutRooms
          isShown={manage}
          setShown={setManage}
          breakoutSession={breakoutSession}
        />
      )}
    </>
  );
};

export default BreakoutMenu;
