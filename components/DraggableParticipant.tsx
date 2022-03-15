import React from 'react';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Badge } from 'evergreen-ui';
import { createPortal } from 'react-dom';
import { DailyParticipant } from '@daily-co/daily-js';

type DraggableParticipantType = {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  participant: DailyParticipant;
};

const DraggableParticipant = ({
  provided,
  snapshot,
  participant,
}: DraggableParticipantType) => {
  const usePortal: boolean = snapshot.isDragging;

  const child = (
    <Badge
      margin={2}
      color="neutral"
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      {participant.user_name}
    </Badge>
  );

  if (!usePortal) return child;
  return createPortal(child, document.querySelector('#myportal'));
};

export default DraggableParticipant;
