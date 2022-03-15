import React, { Dispatch, SetStateAction, useCallback, useState } from 'react';
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

  const returnToLobby = useCallback(() => {
    callFrame?.destroy();
    setCallFrame(null);
    setBreakoutSession(null);
    joinAs(isOwner);
  }, [callFrame, isOwner, joinAs, setBreakoutSession, setCallFrame]);

  return (
    <>
      <Popover
        content={
          <Menu>
            <Menu.Group>
              {breakoutSession?.config?.exp && (
                <Menu.Item disabled icon={TimeIcon}>
                  Time left:{' '}
                  <Timer
                    expiry={breakoutSession?.config.exp as unknown as number}
                  />
                </Menu.Item>
              )}
              {showJoinBreakoutRoomModal ? (
                <Menu.Item icon={LogInIcon} onSelect={() => setShow(true)}>
                  Join breakout rooms
                </Menu.Item>
              ) : (
                breakoutSession?.rooms.length > 1 && (
                  <Menu.Item icon={LogInIcon} onSelect={() => setShow(true)}>
                    Change breakout room
                  </Menu.Item>
                )
              )}
              {isOwner && (
                <Menu.Item
                  icon={SettingsIcon}
                  onSelect={() => setManage(!manage)}
                >
                  Manage rooms
                </Menu.Item>
              )}
              {breakoutSession?.config.allow_user_exit && (
                <Menu.Item
                  icon={LogOutIcon}
                  onSelect={returnToLobby}
                  disabled={!breakoutSession?.config.allow_user_exit}
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
      {manage && <ManageBreakoutRooms isShown={manage} setShown={setManage} />}
    </>
  );
};

export default BreakoutMenu;
