/*
 * This is an example server-side function that generates a meeting token
 * server-side. You could replace this on your own back-end to include
 * custom user authentication, etc.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { isOwner, roomName, username, recordBreakoutRooms } = req.body;

  if (req.method === 'POST') {
    console.log(
      `Getting token for room '${roomName || process.env.DAILY_ROOM}' as owner: ${isOwner}`,
    );

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: {
          room_name: roomName || process.env.DAILY_ROOM,
          is_owner: isOwner,
          enable_recording: 'cloud',
          user_name: username,
          start_cloud_recording: recordBreakoutRooms,
        },
      }),
    };

    const dailyRes = await fetch(
      'https://api.daily.co/v1/meeting-tokens',
      options,
    );

    const { token, error } = await dailyRes.json();

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(200).json({ token, domain: process.env.DAILY_DOMAIN });
  }

  return res.status(500);
}
