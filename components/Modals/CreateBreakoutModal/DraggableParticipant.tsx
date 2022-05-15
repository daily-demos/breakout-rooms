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
      {participant.user_name}
    </Badge>
  );

  if (!usePortal) return child;
  // @ts-ignore
  return createPortal(child, document.querySelector('#myportal'));
};

export default DraggableParticipant;
