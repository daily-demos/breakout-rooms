import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
} from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Dialog,
  Heading,
  Pane,
  PlusIcon,
  Text,
  Paragraph,
} from 'evergreen-ui';
import { DailyParticipant } from '@daily-co/daily-js';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';
import { useBreakoutRoom, roomsInitialValue } from './BreakoutRoomProvider';

type BreakoutModalType = {
  show: boolean;
  setShow: Dispatch<SetStateAction<boolean>>;
};

const getListStyle = (isDraggingOver: any) => ({
  background: isDraggingOver ? 'lightblue' : '#F9FAFC',
  margin: '8px 0',
  display: 'flex',
  padding: 8,
  overflow: 'auto',
  height: '50px',
});

const sample = (arr: [], len: number) => {
  let chunks = [],
    i = 0,
    n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, (i += len)));
  }
  return chunks;
};

const BreakoutModal = ({ show, setShow }: BreakoutModalType) => {
  const { rooms, setRooms, config, setConfig, createSession } =
    useBreakoutRoom();

  const sourceValue = useCallback(
    (source: any) => {
      let r,
        duplicateRooms = rooms;
      if (source.droppableId === 'unassigned') {
        r = rooms.unassigned[source.index];
        duplicateRooms.unassigned.splice(source.index, 1);
      } else {
        r = rooms.assigned[source.droppableId].participants[source.index];
        duplicateRooms.assigned[source.droppableId].participants.splice(
          source.index,
          1,
        );
      }
      setRooms(duplicateRooms);
      return r;
    },
    [rooms, setRooms],
  );

  const handleOnDragEnd = useCallback(
    (result: any) => {
      const r = rooms;
      if (result.destination.droppableId !== 'unassigned') {
        r.assigned[Number(result.destination.droppableId)].participants.push(
          sourceValue(result.source),
        );
      } else r.unassigned.push(sourceValue(result.source));
      setRooms({ ...r });
    },
    [rooms, sourceValue, setRooms],
  );

  const handleAddRoom = () => {
    const assigned = rooms.assigned;
    assigned.push({
      name: `Breakout Room ${assigned.length + 1}`,
      room_url: `${process.env.NEXT_PUBLIC_DAILY_ROOM}-${assigned.length + 1}`,
      created: new Date(),
      participants: [],
    });
    setRooms((rooms: any) => {
      return { ...rooms, assigned };
    });
  };

  const handleAssignEvenly = () => {
    const r = rooms;
    r.assigned.map((room: any, index: number) => {
      if (room?.participants?.length > 0) {
        r.unassigned.push(...room.participants);
        r.assigned[index].participants = [];
      }
    });
    const chunk = sample(
      r.unassigned,
      Math.ceil(r.unassigned.length / r.assigned.length),
    );
    Array.from({ length: r.assigned.length }, (_, i) => {
      r.assigned[i].participants = chunk[i];
    });
    setRooms({ assigned: r.assigned, unassigned: [] });
  };

  const handleRemoveAll = (index: number) => {
    const r = rooms;
    r.unassigned.push(...r.assigned[index].participants);
    r.assigned[index].participants = [];
    setRooms({ ...r });
  };

  const handleSubmit = async () => {
    const status = createSession(rooms.assigned, config);
    // @ts-ignore
    if (status === 'success') {
      setShow(false);
      setRooms(roomsInitialValue(new Date()));
    }
  };

  return (
    <Dialog
      isShown={show}
      title="Create breakout session"
      onCloseComplete={() => setShow(false)}
      preventBodyScrolling
      hasFooter={false}
    >
      <DragDropContext onDragEnd={handleOnDragEnd}>
        {rooms.assigned.map((room: any, index: number) => (
          <div key={index}>
            <Pane display="flex">
              <Pane flex={1} alignItems="center" display="flex">
                <Heading is="h3">{room.name}</Heading>
              </Pane>
              <Pane>
                {room?.participants?.length > 0 && (
                  <Button
                    appearance="minimal"
                    intent="danger"
                    size="small"
                    onClick={() => handleRemoveAll(index)}
                  >
                    Remove all
                  </Button>
                )}
                <Text>({room.participants?.length || 0} people)</Text>
              </Pane>
            </Pane>
            <Droppable droppableId={index.toString()} direction="horizontal">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  style={getListStyle(snapshot.isDraggingOver)}
                >
                  {room?.participants?.map(
                    (participant: DailyParticipant, index: number) => (
                      <Draggable
                        key={participant.user_id}
                        draggableId={participant.user_id}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <Badge
                            margin={2}
                            color="neutral"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            {participant.user_name}
                          </Badge>
                        )}
                      </Draggable>
                    ),
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
        <Pane display="flex">
          <Pane flex={1} alignItems="center" display="flex">
            <Heading is="h3">Unassigned</Heading>
            <Paragraph color="muted" marginLeft={5}>
              (Drag to assign)
            </Paragraph>
          </Pane>
          <Pane>
            <Text>({rooms.unassigned.length} people)</Text>
          </Pane>
        </Pane>
        <Droppable droppableId="unassigned" direction="horizontal">
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              style={getListStyle(snapshot.isDraggingOver)}
            >
              {rooms.unassigned.map(
                (participant: DailyParticipant, index: number) => (
                  <Draggable
                    key={participant.user_id}
                    draggableId={participant.user_id}
                    index={index}
                  >
                    {(provided, snapshot) => (
                      <Badge
                        margin={2}
                        color="neutral"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        {participant.user_name}
                      </Badge>
                    )}
                  </Draggable>
                ),
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
        <Button onClick={handleAssignEvenly}>Assign evenly</Button>
        <Pane marginTop={10}>
          <Heading is="h3">Configurations</Heading>
          <Checkbox
            label="Let participant join after breakout room started"
            checked={config.auto_join}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, auto_join: e.target.checked })
            }
          />
          <Checkbox
            label="Allow participants to return to main lobby at any time"
            checked={config.allow_user_exit}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, allow_user_exit: e.target.checked })
            }
          />
          <Checkbox
            label={
              <>
                Automatically end breakout session after
                <input
                  type="number"
                  min={0}
                  value={config.expiryTime}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setConfig({ ...config, expiryTime: e.target.valueAsNumber })
                  }
                  style={{ margin: '0 5px', width: '40px' }}
                />
                minutes
              </>
            }
            checked={config.exp}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setConfig({ ...config, exp: e.target.checked })
            }
          />
          <Checkbox
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
      <Pane display="flex" marginY={20}>
        <Pane flex={1} alignItems="center" display="flex">
          <Button onClick={() => setShow(false)}>Cancel</Button>
        </Pane>
        <Pane>
          <Button iconAfter={PlusIcon} marginRight={16} onClick={handleAddRoom}>
            Add Room
          </Button>
          <Button
            appearance="primary"
            disabled={rooms.unassigned.length > 0}
            onClick={handleSubmit}
          >
            Open Rooms
          </Button>
        </Pane>
      </Pane>
    </Dialog>
  );
};

export default BreakoutModal;
