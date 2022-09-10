import React, { useCallback, useMemo } from 'react';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { Badge } from 'evergreen-ui';
import { createPortal } from 'react-dom';
import { DailyParticipant } from '@daily-co/daily-js';
import {
  useParticipantIds,
  useParticipantProperty,
} from '@daily-co/daily-react-hooks';
import { useCall } from '../../../contexts/CallProvider';

type DraggableParticipantType = {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  userId: string;
  usePresence?: boolean;
};

type PresenceParticipantType = {
  id: string;
  userId: string;
  userName: string;
  joinTime: Date;
  duration: number;
  room: string;
};

const DraggableParticipant = ({
  provided,
  snapshot,
  userId,
  usePresence = false,
}: DraggableParticipantType) => {
  const { presence } = useCall();

  const participants: PresenceParticipantType[] = useMemo(() => {
    return Object.values(presence).flat(1) as PresenceParticipantType[];
  }, [presence]);

  const participant = participants.find(p => p.userId === userId);

  const participantId = useParticipantIds({
    filter: useCallback(
      (participant: DailyParticipant) => {
        return participant.user_id === userId;
      },
      [userId],
    ),
  })?.[0];
  const participantUserName = useParticipantProperty(
    participantId as string,
    'user_name',
  );
  const userName = usePresence
    ? participant?.userName
    : participantUserName !== ''
    ? participantUserName
    : participantId;
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
  return createPortal(child, document.querySelector('#myportal') as Element);
};

export default DraggableParticipant;
