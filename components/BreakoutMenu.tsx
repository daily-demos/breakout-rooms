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
import { useBreakoutRoom } from './BreakoutRoomProvider';
import ManageBreakoutRooms from './ManageBreakoutRooms';
import { useCall } from './CallProvider';

type BreakoutMenuType = {
  showJoinBreakoutRoomModal: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
  joinAs: (owner?: boolean) => void;
  isOwner: boolean;
};

const BreakoutMenu = ({
  showJoinBreakoutRoomModal,
  setShow,
  joinAs,
  isOwner,
}: BreakoutMenuType) => {
  const { callFrame, setCallFrame } = useCall();
  const { breakoutSession, setBreakoutSession } = useBreakoutRoom();
  const [manage, setManage] = useState<boolean>(false);
  const { endSession } = useBreakoutRoom();

  return (
    <>
      <Popover
        content={
          <Menu>
            <Menu.Group>
              <Menu.Item disabled icon={TimeIcon}>
                Time left: <Timer expiry={breakoutSession.config.exp} />
              </Menu.Item>
              <Menu.Item icon={LogInIcon} onSelect={() => setShow(true)}>
                {showJoinBreakoutRoomModal
                  ? 'Join breakout rooms'
                  : 'Change breakout room'}
              </Menu.Item>
              {isOwner && (
                <Menu.Item
                  icon={SettingsIcon}
                  onSelect={() => setManage(!manage)}
                >
                  Manage rooms
                </Menu.Item>
              )}
              <Menu.Item
                icon={LogOutIcon}
                onSelect={() => {
                  callFrame?.destroy();
                  setCallFrame(null);
                  setBreakoutSession(null);
                  joinAs(isOwner);
                }}
                disabled={!breakoutSession.config.allow_user_exit}
              >
                Return to lobby
              </Menu.Item>
            </Menu.Group>
            {isOwner && (
              <>
                <Menu.Divider />
                <Menu.Group>
                  <Menu.Item
                    icon={SmallCrossIcon}
                    intent="danger"
                    onSelect={() => {
                      setShow(false);
                      endSession();
                    }}
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
