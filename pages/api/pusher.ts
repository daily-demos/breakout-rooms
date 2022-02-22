import type { NextApiRequest, NextApiResponse } from 'next';
import Pusher from 'pusher';

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID as string,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY as string,
  secret: process.env.PUSHER_SECRET as string,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER as string,
  useTLS: true,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
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
            privacy: 'public',
            properties: {
              start_audio_off: true,
              start_video_off: true,
              enable_prejoin_ui: false,
              enable_recording: 'cloud',
              exp: sessionObject.config.exp,
              eject_at_room_exp: true,
            },
          }),
        };

        await fetch('https://api.daily.co/v1/rooms', options);
      });
    }

    await pusher.trigger('breakout-rooms', event, { sessionObject });
    return res.status(200).json({ status: 'success' });
  }
  return res.status(500);
}
