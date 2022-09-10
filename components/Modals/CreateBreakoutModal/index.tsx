import React, { useCallback } from 'react';
import {
  Button,
  Dialog,
  Heading,
  Pane,
  Text,
  EmptyState,
  LockIcon,
  minorScale,
} from 'evergreen-ui';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
  DraggableLocation,
} from 'react-beautiful-dnd';
import { useBreakoutRoom } from '../../../contexts/BreakoutRoomProvider';
import {
  DailyBreakoutProviderRooms,
  DailyBreakoutRoom,
} from '../../../types/next';
import { getListStyle } from '../../../lib/listStyle';
import DraggableParticipant from './DraggableParticipant';
import { useCall } from '../../../contexts/CallProvider';
import BreakoutConfigurations from '../../BreakoutConfigurations';
import { useLocalParticipant } from '@daily-co/daily-react-hooks';

const BreakoutModal = () => {
  const { showBreakoutModal, setShowBreakoutModal, room } = useCall();
  const { rooms, setRooms, config, setConfig, createSession, autoAssign, reset } =
    useBreakoutRoom();
  const localParticipant = useLocalParticipant();

  // whenever we drag and drop the participants in the breakout room modal,
  // we will be returned the source index, so we need to get the value of the dragged item,
  // this function allows us to get the value of it.
  const sourceValue = useCallback(
    (source: DraggableLocation): string => {
      let r,
        duplicateRooms = rooms;
      if (source.droppableId === 'unassigned') {
        r = rooms.unassignedParticipants[source.index];
        duplicateRooms.unassignedParticipants.splice(source.index, 1);
      } else {
        // we have to cast the type to unknown as it's default string, but we need it to be
        // number to get the particular index.
        r =
          rooms.assigned[source.droppableId as unknown as number]
            ?.participantIds[source.index];
        duplicateRooms.assigned[
          source.droppableId as unknown as number
        ]?.participantIds.splice(source.index, 1);
      }
      setRooms(duplicateRooms);
      return r as string;
    },
    [rooms, setRooms],
  );

  const handleOnDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;

      const r = rooms;
      if (result.destination.droppableId !== 'unassigned') {
        r.assigned[Number(result.destination.droppableId)]?.participantIds.push(
          sourceValue(result.source),
        );
      } else r.unassignedParticipants.push(sourceValue(result?.source));
      setRooms({ ...r });
    },
    [rooms, sourceValue, setRooms],
  );

  const handleAddRoom = () => {
    const assigned = rooms.assigned;
    assigned.push({
      name: `Breakout Room ${assigned.length + 1}`,
      roomName: `${room}-${assigned.length + 1}`,
      created: new Date(),
      participantIds: [],
    });
    setRooms((rooms: DailyBreakoutProviderRooms) => {
      return { ...rooms, assigned };
    });
  };

  const handleAssignEvenly = () => autoAssign(rooms.assigned.length);

  return (
    <Dialog
      isShown={showBreakoutModal}
      title="Create breakout session"
      onCloseComplete={() => setShowBreakoutModal(false)}
      preventBodyScrolling
      hasFooter={false}
    >
      {localParticipant?.owner ? (
        <>
          <div>
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
                    // @ts-ignore
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
                      (userId: string, index: number) => (
                        <Draggable
                          key={userId}
                          draggableId={userId}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <DraggableParticipant
                              provided={provided}
                              snapshot={snapshot}
                              userId={userId}
                            />
                          )}
                        </Draggable>
                      ),
                    )}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <div style={{ maxHeight: '20vh', overflow: 'auto' }}>
                <Pane
                  display="grid"
                  gridTemplateColumns="repeat(2, 1fr)"
                  gridGap={10}
                  marginTop={20}
                >
                  {rooms.assigned.map(
                    (room: DailyBreakoutRoom, index: number) => (
                      <div key={index}>
                        <Pane display="flex">
                          <Heading is="h3">{room.name}</Heading>
                          <Text marginLeft={5}>
                            {room.participantIds?.length > 0 &&
                              `(${room.participantIds?.length} people)`}
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
                              // @ts-ignore
                              style={getListStyle(
                                snapshot.isDraggingOver,
                                room?.participantIds?.length,
                              )}
                            >
                              {room?.participantIds?.length < 1 && (
                                <Pane
                                  width="100%"
                                  height="100%"
                                  display="flex"
                                  textAlign="center"
                                  justifyContent="center"
                                  alignItems="center"
                                >
                                  {snapshot.isDraggingOver ? (
                                    <Text color="muted">
                                      Drop to add to room
                                    </Text>
                                  ) : (
                                    <Text color="muted">Drag people here</Text>
                                  )}
                                </Pane>
                              )}
                              {room?.participantIds?.map(
                                (userId: string, index: number) => (
                                  <Draggable
                                    key={userId}
                                    draggableId={userId}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <DraggableParticipant
                                        provided={provided}
                                        snapshot={snapshot}
                                        userId={userId}
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
              </div>
              <Button onClick={handleAddRoom}>Add room</Button>
              <Button onClick={reset} marginLeft={minorScale(1)}>Reset</Button>
              <Pane marginTop={20}>
                <Heading is="h3">Configurations</Heading>
                <BreakoutConfigurations config={config} setConfig={setConfig} />
              </Pane>
            </DragDropContext>
          </div>
          <Pane display="flex" marginY={20}>
            <Button
              marginRight={10}
              appearance="primary"
              disabled={rooms.unassignedParticipants.length > 0}
              onClick={() => createSession()}
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
            title="You need to be a meeting owner to create breakout sessions"
            orientation="vertical"
            icon={<LockIcon color="#EBAC91" />}
            iconBgColor="#F8E3DA"
            description="Participants cannot create or manage breakout sessions."
          />
        </Pane>
      )}
    </Dialog>
  );
};

export default BreakoutModal;
