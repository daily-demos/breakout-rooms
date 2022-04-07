import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  useCallback,
  useState,
} from 'react';
import {
  SideSheet,
  Pane,
  Heading,
  Card,
  Paragraph,
  Button,
  Checkbox,
} from 'evergreen-ui';
import { DailyParticipant } from '@daily-co/daily-js';
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { useBreakoutRoom } from '../contexts/BreakoutRoomProvider';
import { DailyBreakoutRoom, DailyBreakoutSession } from '../types/next';
import { getListStyle } from '../utils';
import DraggableParticipant from './DraggableParticipant';

type ManageBreakoutRoomsType = {
  isShown: boolean;
  setShown: Dispatch<SetStateAction<boolean>>;
};

const ManageBreakoutRooms = ({
  isShown,
  setShown,
}: ManageBreakoutRoomsType) => {
  const { breakoutSession, updateSession } = useBreakoutRoom();
  const [newParticipantIds, setNewParticipantIds] = useState<String[]>([]);
  const [newBreakoutSession, setNewBreakoutSession] =
    useState<DailyBreakoutSession>(
      breakoutSession as unknown as DailyBreakoutSession,
    );
  const [config, setConfig] = useState(breakoutSession?.config);

  const handleOnDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source } = result;
      const r = newBreakoutSession?.rooms;

      if (!r) return;

      const destinationDroppableId = Number(destination.droppableId);
      const sourceDroppableId = Number(source.droppableId);

      r[destinationDroppableId].participants.push(
        r[sourceDroppableId].participants[source.index],
      );
      r[destinationDroppableId].participantIds?.push(
        r[sourceDroppableId].participants[source.index].user_id,
      );
      setNewParticipantIds(newParticipantIds => [
        ...newParticipantIds,
        r[sourceDroppableId].participants[source.index].user_id,
      ]);
      r[sourceDroppableId].participants.splice(source.index, 1);
      r[sourceDroppableId].participantIds?.splice(source.index, 1);
      setNewBreakoutSession((newBreakoutSession: DailyBreakoutSession) => {
        return {
          ...newBreakoutSession,
          rooms: r,
        };
      });
    },
    [newBreakoutSession.rooms],
  );

  const handleSave = async () => {
    const b = newBreakoutSession;
    b.config = config;
    updateSession(b, newParticipantIds);
  };

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
      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Pane zIndex={1} flexShrink={0} elevation={0} backgroundColor="white">
          <Pane padding={16} borderBottom="muted">
            <Heading size={600}>Breakout Rooms</Heading>
            <Paragraph size={400} color="muted">
              Manage the breakout session configurations.
            </Paragraph>
          </Pane>
        </Pane>
        <Pane flex="1" overflowY="scroll" background="tint1" padding={16}>
          {breakoutSession.rooms.map(
            (room: DailyBreakoutRoom, index: number) => (
              <Pane key={index} marginBottom={20}>
                <Card backgroundColor="white" elevation={0} padding={20}>
                  <Heading>{room.name}</Heading>
                  <Droppable
                    droppableId={index.toString()}
                    direction="horizontal"
                  >
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
                </Card>
              </Pane>
            ),
          )}
          <Pane marginTop={10}>
            <Card backgroundColor="white" elevation={0} padding={20}>
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
                      value={config?.expiryTime ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setConfig({
                          ...config,
                          expiryTime: e.target.valueAsNumber,
                        })
                      }
                      style={{ margin: '0 5px', width: '40px' }}
                    />
                    minutes
                  </>
                }
                disabled
                checked={config.exp}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfig({ ...config, exp: e.target.checked })
                }
              />
              <Checkbox
                label="Record breakout session (will start automatically)"
                disabled
                checked={config.record_breakout_sessions}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfig({
                    ...config,
                    record_breakout_sessions: e.target.checked,
                  })
                }
              />
            </Card>
          </Pane>
        </Pane>
        <Button
          size="large"
          margin={20}
          appearance="primary"
          onClick={handleSave}
        >
          Save
        </Button>
      </DragDropContext>
    </SideSheet>
  );
};

export default ManageBreakoutRooms;
