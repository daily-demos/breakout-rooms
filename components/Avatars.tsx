import React from 'react';
import { Avatar, Tooltip } from 'evergreen-ui';

type AvatarsType = {
  participants: any[];
};

const AvatarItem = ({ participant }: any) => {
  return (
    <Tooltip content={participant.userName} key={participant.userId}>
      <Avatar name={participant.userName} size={30} margin={2} />
    </Tooltip>
  );
};

const Avatars = ({ participants }: AvatarsType) => {
  return (
    <>
      {participants
        ? participants.map(participant => (
            <AvatarItem participant={participant} key={participant.userId} />
          ))
        : null}
    </>
  );
};

export default Avatars;
