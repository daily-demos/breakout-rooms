import { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '../../types/next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO,
) {
  const { guid, groupName } = JSON.parse(req.body);

  if (req.method === 'POST') {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        apiKey: process.env.COMET_CHAT_APP_API_KEY,
      },
      body: JSON.stringify({
        guid,
        name: groupName,
        type: 'public',
      }),
      json: true,
    };

    const dailyRes = await fetch(
      `https://${process.env.NEXT_PUBLIC_COMET_CHAT_APP_ID}.api-${process.env.NEXT_PUBLIC_COMET_CHAT_APP_REGION}.cometchat.io/v3/groups`,
      options,
    );

    const { data, error } = await dailyRes.json();

    if (error) {
      return res.status(500).json({ error });
    }

    return res.status(200).json({ data });
  }

  return res.status(500);
}
