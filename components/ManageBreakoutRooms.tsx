import React, { Dispatch, SetStateAction, useMemo } from 'react';
import Image from 'next/image';
import {
  SideSheet,
  Pane,
  Heading,
  Strong,
  Card,
  IconButton,
  MoreIcon,
  Popover,
  Position,
  Menu,
} from 'evergreen-ui';
import { DailyCall } from '@daily-co/daily-js';
import IconCameraOn from './icons/camera-on-sm.svg';
import IconCameraOff from './icons/camera-off-sm.svg';
import IconMicOn from './icons/mic-on-sm.svg';
import IconMicOff from './icons/mic-off-sm.svg';

type ManageBreakoutRoomsType = {
  isShown: boolean;
  setShown: Dispatch<SetStateAction<boolean>>;
  breakoutSession: any;
  call: DailyCall;
};

type ParticipantRowType = {
  participant: any;
};

const ParticipantRow = ({ participant }: ParticipantRowType) => {
  return (
    <Pane display="flex" padding={5} key={participant.user_id}>
      <Pane flex={1} alignItems="center" display="flex">
        <Strong>
          {participant.user_name} {participant.local && '(you)'}
        </Strong>
      </Pane>
      <Pane>
        <Popover
          position={Position.BOTTOM_RIGHT}
          content={
            <Menu>
              <Menu.Group>
                <Menu.Item>Move participant</Menu.Item>
              </Menu.Group>
              <Menu.Divider />
              <Menu.Group>
                <Menu.Item intent="danger">Remove</Menu.Item>
              </Menu.Group>
            </Menu>
          }
        >
          <IconButton appearance="minimal" icon={MoreIcon} marginX={2} />
        </Popover>
        <IconButton
          appearance="minimal"
          icon={
            <Image src={participant.audio ? IconMicOn : IconMicOff} alt="Mic" />
          }
          disabled
          marginX={2}
        />
        <IconButton
          appearance="minimal"
          icon={
            <Image
              src={participant.video ? IconCameraOn : IconCameraOff}
              alt="camera"
            />
          }
          disabled
          marginX={2}
        />
      </Pane>
    </Pane>
  );
};

const ManageBreakoutRooms = ({
  isShown,
  setShown,
  breakoutSession,
  call,
}: ManageBreakoutRoomsType) => {
  const participants = call?.participants();

  return (
    <SideSheet
      isShown={isShown}
      onCloseComplete={() => setShown(false)}
      width={500}
      containerProps={{
        display: 'flex',
        flex: '1',
        flexDirection: 'column',
      }}
    >
      <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
        <Pane padding={16} borderBottom="muted">
          <Heading size={600}>Breakout Rooms</Heading>
        </Pane>
      </Pane>
      <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
        <Card backgroundColor="white" elevation={0} padding={20}>
          {breakoutSession.rooms.map((room: any, index: number) => {
            if (room?.participants?.length > 0)
              return (
                <Pane key={index} marginBottom={10}>
                  <Heading>{room.name}</Heading>
                  {room?.participants?.map((participant: any) => (
                    <ParticipantRow
                      participant={participant}
                      key={participant}
                    />
                  ))}
                </Pane>
              );
          })}
        </Card>
      </Pane>
    </SideSheet>
  );
};

export default ManageBreakoutRooms;
