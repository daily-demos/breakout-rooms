import React, { ChangeEvent, useCallback } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  Heading,
  Pane,
  Text,
  EmptyState,
  LockIcon,
} from 'evergreen-ui';
import { DailyParticipant } from '@daily-co/daily-js';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import {
  useBreakoutRoom,
  roomsInitialValue,
} from '../../contexts/BreakoutRoomProvider';
import {
  DailyBreakoutProviderRooms,
  DailyBreakoutRoom,
} from '../../types/next';
import { getListStyle, getSample } from '../../utils';
import DraggableParticipant from '../DraggableParticipant';
import { DropResult, DraggableLocation } from 'react-beautiful-dnd';
import { useCall } from '../../contexts/CallProvider';

type BreakoutModalType = {
  isOwner: boolean;
};

const BreakoutModal = ({ isOwner }: BreakoutModalType) => {
  const { showBreakoutModal, setShowBreakoutModal } = useCall();
  const { rooms, setRooms, config, setConfig, createSession } =
    useBreakoutRoom();

  // whenever we drag and drop the participants in the breakout room modal,
  // we will be returned the source index, so we need to get the value of the dragged item,
  // this function allows us to get the value of it.
  const sourceValue = useCallback(
    (source: DraggableLocation) => {
      let r,
        duplicateRooms = rooms;
      if (source.droppableId === 'unassigned') {
        r = rooms.unassignedParticipants[source.index];
        duplicateRooms.unassignedParticipants.splice(source.index, 1);
      } else {
        // we have to cast the type to unknown as it's default string, but we need it to be
        // number to get the particular index.
        r =
          rooms.assigned[source.droppableId as unknown as number].participants[
            source.index
          ];
        duplicateRooms.assigned[
          source.droppableId as unknown as number
        ].participants.splice(source.index, 1);
      }
      setRooms(duplicateRooms);
      return r;
    },
    [rooms, setRooms],
  );

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      const r = rooms;
      if (result.destination.droppableId !== 'unassigned') {
        r.assigned[Number(result.destination.droppableId)].participants.push(
          sourceValue(result.source),
        );
      } else r.unassignedParticipants.push(sourceValue(result.source));
      setRooms({ ...r });
    },
    [rooms, sourceValue, setRooms],
  );

  const handleAddRoom = () => {
    const assigned = rooms.assigned;
    assigned.push({
      name: `Breakout Room ${assigned.length + 1}`,
      roomName: `${process.env.NEXT_PUBLIC_DAILY_ROOM_NAME}-${
        assigned.length + 1
      }`,
      created: new Date(),
      participants: [],
    });
    setRooms((rooms: DailyBreakoutProviderRooms) => {
      return { ...rooms, assigned };
    });
  };

  const handleAssignEvenly = () => {
    const r: DailyBreakoutProviderRooms = rooms;
    r.assigned.map((room: DailyBreakoutRoom, index: number) => {
      if (room?.participants?.length > 0) {
        r.unassignedParticipants.push(...room.participants);
        r.assigned[index].participants = [];
      }
    });
    const chunk = getSample(
      r.unassignedParticipants,
      Math.ceil(r.unassignedParticipants.length / r.assigned.length),
    );
    Array.from({ length: r.assigned.length }, (_, i) => {
      r.assigned[i].participants = chunk[i];
    });
    setRooms({ assigned: r.assigned, unassignedParticipants: [] });
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    type = 'checkbox',
  ) => {
    if (type === 'number')
      setConfig({ ...config, [e.target.name]: e.target.valueAsNumber });
    else setConfig({ ...config, [e.target.name]: e.target.checked });
  };

  const handleSubmit = async () => {
    const status = createSession(rooms.assigned as DailyBreakoutRoom[], config);
    // @ts-ignore
    if (status === 'success') {
      setShowBreakoutModal(false);
      setRooms(roomsInitialValue(new Date()));
    }
  };

  return (
    <Dialog
      isShown={showBreakoutModal}
      title="Create breakout session"
      onCloseComplete={() => setShowBreakoutModal(false)}
      preventBodyScrolling
      hasFooter={false}
    >
      {isOwner ? (
        <>
          <div style={{ overflow: 'auto' }}>
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Pane display="flex">
                <Pane flex={1} alignItems="center" display="flex">
                  <Heading is="h3">Participants</Heading>
                </Pane>
                <Pane>
                  <Text>({rooms.unassignedParticipants.length} people)</Text>
                </Pane>
              </Pane>
              <Droppable droppableId="unassigned" direction="horizontal">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={getListStyle(
                      snapshot.isDraggingOver,
                      rooms.unassignedParticipants.length,
                    )}
                  >
                    {rooms.unassignedParticipants.length < 1 && (
                      <Pane
                        width="100%"
                        height="100%"
                        display="flex"
                        textAlign="center"
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Text color="muted">All in breakout rooms</Text>
                      </Pane>
                    )}
                    {rooms.unassignedParticipants.map(
                      (participant: DailyParticipant, index: number) => (
                        <Draggable
                          key={participant.user_id}
                          draggableId={participant.user_id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <DraggableParticipant
                              provided={provided}
                              snapshot={snapshot}
                              participant={participant}
                            />
                          )}
                        </Draggable>
                      ),
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <Pane
                display="grid"
                gridTemplateColumns="repeat(auto-fit, minmax(100px, 1fr));"
                gridGap={10}
                marginTop={20}
              >
                {rooms.assigned.map(
                  (room: DailyBreakoutRoom, index: number) => (
                    <div key={index}>
                      <Pane display="flex">
                        <Heading is="h3">{room.name}</Heading>
                        <Text marginLeft={5}>
                          {room.participants?.length > 0 &&
                            `(${room.participants?.length} people)`}
                        </Text>
                      </Pane>
                      <Droppable
                        droppableId={index.toString()}
                        direction="horizontal"
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={getListStyle(
                              snapshot.isDraggingOver,
                              room?.participants?.length,
                            )}
                          >
                            {room?.participants?.length < 1 && (
                              <Pane
                                width="100%"
                                height="100%"
                                display="flex"
                                textAlign="center"
                                justifyContent="center"
                                alignItems="center"
                              >
                                {snapshot.isDraggingOver ? (
                                  <Text color="muted">Drop to add to room</Text>
                                ) : (
                                  <Text color="muted">Drag people here</Text>
                                )}
                              </Pane>
                            )}
                            {room?.participants?.map(
                              (
                                participant: DailyParticipant,
                                index: number,
                              ) => (
                                <Draggable
                                  key={participant.user_id}
                                  draggableId={participant.user_id}
                                  index={index}
                                >
                                  {(provided, snapshot) => (
                                    <DraggableParticipant
                                      provided={provided}
                                      snapshot={snapshot}
                                      participant={participant}
                                    />
                                  )}
                                </Draggable>
                              ),
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ),
                )}
              </Pane>
              <Button onClick={handleAddRoom}>Add room</Button>
              <Pane marginTop={20}>
                <Heading is="h3">Configurations</Heading>
                <Checkbox
                  name="auto_join"
                  label="Let participant join after breakout room started"
                  checked={config.auto_join}
                  onChange={handleChange}
                />
                <Checkbox
                  name="allow_user_exit"
                  label="Allow participants to return to main lobby at any time"
                  checked={config.allow_user_exit}
                  onChange={handleChange}
                />
                <Checkbox
                  name="exp"
                  label={
                    <>
                      Automatically end breakout session after
                      <input
                        name="expiryTime"
                        type="number"
                        min={0}
                        value={config.expiryTime ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          handleChange(e, 'number')
                        }
                        style={{ margin: '0 5px', width: '40px' }}
                      />
                      minutes
                    </>
                  }
                  checked={config.exp}
                  onChange={handleChange}
                />
                <Checkbox
                  name="record_breakout_sessions"
                  label="Record breakout session (will start automatically)"
                  checked={config.record_breakout_sessions}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfig({
                      ...config,
                      record_breakout_sessions: e.target.checked,
                    })
                  }
                />
              </Pane>
            </DragDropContext>
          </div>
          <Pane display="flex" marginY={20}>
            <Button
              marginRight={10}
              appearance="primary"
              disabled={rooms.unassignedParticipants.length > 0}
              onClick={handleSubmit}
            >
              Create Rooms
            </Button>
            <Button onClick={handleAssignEvenly}>
              Assign participants evenly
            </Button>
          </Pane>
        </>
      ) : (
        <Pane width="auto" height="auto">
          <EmptyState
            title="You need permission to create breakout session"
            orientation="vertical"
            icon={<LockIcon color="#EBAC91" />}
            iconBgColor="#F8E3DA"
            description="To see these sources, you need to join as owner, participants can not create breakout sessions"
          />
        </Pane>
      )}
    </Dialog>
  );
};

export default BreakoutModal;
