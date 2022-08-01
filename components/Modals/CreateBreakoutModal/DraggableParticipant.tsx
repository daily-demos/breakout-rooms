import React, { useCallback } from 'react';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Badge } from 'evergreen-ui';
import { createPortal } from 'react-dom';
import { DailyParticipant } from '@daily-co/daily-js';
import {
  useParticipantIds,
  useParticipantProperty,
} from '@daily-co/daily-react-hooks';

type DraggableParticipantType = {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  userId: string;
};

const DraggableParticipant = ({
  provided,
  snapshot,
  userId,
}: DraggableParticipantType) => {
  const participantsId = useParticipantIds({
    filter: useCallback(
      (participant: DailyParticipant) => {
        return participant.user_id === userId;
      },
      [userId],
    ),
  });
  const userName = useParticipantProperty(participantsId?.[0], 'user_name');
  const usePortal: boolean = snapshot.isDragging;

  const child = (
    <Badge
      color="neutral"
      margin={2}
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      height={24}
      fontSize={12}
      paddingY={4}
      paddingX={6}
      border="1px solid #C8D1DC"
      textTransform="initial"
    >
      {userName}
    </Badge>
  );

  if (!usePortal) return child;
  return createPortal(child, document.querySelector('#myportal'));
};

export default DraggableParticipant;
