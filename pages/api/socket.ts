import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../../types/next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  const { sessionObject, event } = JSON.parse(req.body);

  if (req.method === 'POST') {
    if (event === 'DAILY_BREAKOUT_STARTED') {
      // create daily breakout rooms.
      sessionObject.rooms.map(async (room: any) => {
        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
          },
          body: JSON.stringify({
            name: room.room_url,
            privacy: 'private',
            properties: {
              start_audio_off: true,
              start_video_off: true,
              enable_prejoin_ui: false,
              enable_recording: 'cloud',
              exp: sessionObject.config.exp,
            },
          }),
        };

        await fetch('https://api.daily.co/v1/rooms', options);
      });
    }

    res?.socket?.server?.io?.emit(event, { sessionObject });
    return res.status(200).json({ status: 'success' });
  }
  return res.status(500);
}
