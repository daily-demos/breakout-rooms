import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../../types/next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  const { sessionObject, event, newParticipantIds } = JSON.parse(req.body);

  if (req.method === 'POST') {
    if (event === 'DAILY_BREAKOUT_STARTED') {
      // create daily breakout rooms.
      sessionObject.rooms.map(async (room: any) => {
        // Basic, required room properties
        const roomProperties = {
          start_audio_off: true,
          start_video_off: true,
          enable_prejoin_ui: false,
          exp: sessionObject.config.exp,
        };

        let retCode = await createRoom(room.room_url, roomProperties, {
          enable_recording: 'cloud',
        });
        // If something went wrong, early out with response code
        if (retCode !== 200) {
          return res.status(retCode);
        }
      });
    }
    res?.socket?.server?.io?.emit(event, { sessionObject, newParticipantIds });
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
  roomURL: string,
  roomProperties: any,
  additionalProperties: any = null,
): Promise<number> {
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
    },
    body: JSON.stringify({
      name: roomURL,
      privacy: 'private',
      // Basic + additional properties
      properties: {
        ...roomProperties,
        ...additionalProperties,
      },
    }),
  };

  let dailyStatusCode = -1;
  return fetch('https://api.daily.co/v1/rooms', options)
    .then(response => {
      // Register the status code we get from Daily
      dailyStatusCode = response.status;
      // If everything is OK, just return 200
      if (dailyStatusCode === 200) return 200;
      // If something went wrong, get response body
      return response.json();
    })
    .then(data => {
      if (data === 200) return 200;

      // Check if one of the additional properties is actually the problematic one,
      // and retry without it if so
      const errorMsg = data?.info;
      console.log(
        `Failed to create breakout room. Status code: ${dailyStatusCode}, error: ${errorMsg}`,
      );
      if (dailyStatusCode === 400 && additionalProperties && errorMsg) {
        for (const property in additionalProperties) {
          if (errorMsg.includes(`'${property}'`)) {
            delete additionalProperties[property];
            return createRoom(roomURL, roomProperties, additionalProperties);
          }
        }
      }
      return 500;
    });
}
