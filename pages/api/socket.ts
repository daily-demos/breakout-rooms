import type { NextApiRequest } from 'next';
import { DailyBreakoutRoom, NextApiResponseServerIO } from '../../types/next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  const { sessionObject, event, newParticipantIds, room } = JSON.parse(
    req.body,
  );

  if (req.method === 'POST') {
    if (event === 'DAILY_BREAKOUT_STARTED') {
      // create daily breakout rooms.
      sessionObject.rooms.map(async (room: DailyBreakoutRoom) => {
        // Basic, required room properties
        const roomProperties = {
          start_audio_off: true,
          start_video_off: true,
          enable_prejoin_ui: false,
          enable_chat: true,
          enable_network_ui: true,
          exp: sessionObject.config.exp,
        };

        let retCode = await createRoom(room.roomName, roomProperties, {
          enable_recording: 'cloud',
        });

        // If something went wrong, early out with response code
        if (retCode !== 200) {
          return res.status(retCode);
        }
      });
    }
    res?.socket?.server?.io?.emit(event, {
      room,
      sessionObject,
      newParticipantIds,
    });
    return res.status(200).json({ status: 'success' });
  }
  return res.status(500);
}

// createRoom attempts to createa a Daily room.
// roomProperties are required, minimum viable properties
// for the room.
// additionalProperties are extras that may be removed if
// creation with them fails.
function createRoom(
  roomName: string,
  roomProperties: { [key: string]: string | boolean | number },
  additionalProperties: {
    [key: string]: string | boolean | number;
  } | null = null,
): Promise<number> {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomName,
      privacy: 'private',
      // Basic + additional properties
      properties: {
        ...roomProperties,
        ...additionalProperties,
      },
    }),
  };

  const url: string = `${
    process.env.DAILY_API_URL || 'https://api.daily.co/v1'
  }/rooms`;
  return fetch(url, options).then(async response => {
    // If everything is OK, just return 200
    if (response.status === 200) return 200;
    // If something went wrong, get response body
    const data = await response.json();

    // Check if one of the additional properties is actually the problematic one,
    // and retry without it if so
    const errorMsg = data?.info;
    console.log(
      `Failed to create breakout room. Status code: ${response.status}, error: ${errorMsg}`,
    );
    if (response.status === 400 && additionalProperties && errorMsg) {
      for (const property in additionalProperties) {
        if (errorMsg.includes(`'${property}'`)) {
          delete additionalProperties[property];
          return createRoom(roomName, roomProperties, additionalProperties);
        }
      }
    }
    return 500;
  });
}
