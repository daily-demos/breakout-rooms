import React, { useCallback } from 'react';
import {
  Button,
  Heading,
  Pane,
  Text,
  EmptyState,
  LockIcon,
  SideSheet,
  minorScale,
  majorScale,
  Paragraph,
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
  const {
    rooms,
    setRooms,
    config,
    setConfig,
    createSession,
    autoAssign,
    reset,
  } = useBreakoutRoom();
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

  const handleAddRoom = useCallback(() => {
    setRooms((rooms: DailyBreakoutProviderRooms) => {
      const assigned = rooms.assigned;
      assigned.push({
        name: `Breakout Room ${assigned.length + 1}`,
        roomName: `${room}-${assigned.length + 1}`,
        created: new Date(),
        participantIds: [],
      });
      return { ...rooms, assigned };
    });
  }, [room, setRooms]);

  const handleAssignEvenly = () => autoAssign(rooms.assigned.length);

  return (
    <SideSheet
      isShown={showBreakoutModal}
      onCloseComplete={() => setShowBreakoutModal(false)}
      width={500}
      containerProps={{
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
        <Pane padding={16} borderBottom="muted">
          <Heading size={600}>Create breakout session</Heading>
          <Paragraph size={400} color="muted">
            Assign participants to breakout rooms and manage configurations
          </Paragraph>
        </Pane>
      </Pane>
      {localParticipant?.owner ? (
        <Pane
          background="tint1"
          padding={16}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          height="100%"
        >
          <Pane flex={1}>
            <DragDropContext onDragEnd={handleOnDragEnd}>
              <Pane display="flex" justifyContent="space-between">
                <Pane display="flex" alignItems="center" gap={minorScale(1)}>
                  <Heading is="h3">Participants</Heading>
                  <Text>({rooms.unassignedParticipants.length} people)</Text>
                </Pane>
                <Button intent="danger" appearance="minimal" onClick={reset}>
                  Reset
                </Button>
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
              <div style={{ maxHeight: '35vh', overflow: 'auto' }}>
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
            </DragDropContext>
            <Heading is="h3">Configurations</Heading>
            <BreakoutConfigurations config={config} setConfig={setConfig} />
          </Pane>
          <Pane>
            <Pane display="flex" marginY={majorScale(1)} gap={majorScale(1)}>
              <Button onClick={handleAddRoom} width="100%">
                Add room
              </Button>
              <Button
                onClick={handleAssignEvenly}
                width="100%"
                appearance="primary"
              >
                Assign participants evenly
              </Button>
            </Pane>
            <Pane display="flex" gap={minorScale(2)}>
              <Button
                width="100%"
                appearance="primary"
                disabled={rooms.unassignedParticipants.length > 0}
                onClick={() => createSession()}
              >
                Start breakout session
              </Button>
            </Pane>
          </Pane>
        </Pane>
      ) : (
        <Pane background="tint1">
          <EmptyState
            title="You need to be a meeting owner to create breakout sessions"
            orientation="vertical"
            icon={<LockIcon color="#EBAC91" />}
            iconBgColor="#F8E3DA"
            description="Participants cannot create or manage breakout sessions."
          />
        </Pane>
      )}
    </SideSheet>
  );
};

export default BreakoutModal;
