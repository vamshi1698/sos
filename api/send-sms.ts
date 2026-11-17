const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.VITE_TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.VITE_TWILIO_AUTH_TOKEN || '';
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID || process.env.VITE_TWILIO_MESSAGING_SERVICE_SID || '';

export default async function handler(req: any, res: any) {
  // Enable CORS for web clients
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const bodyObj = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { to, body } = bodyObj;

    if (!to || !body) {
      return res.status(400).json({ error: 'Missing "to" or "body"' });
    }

    const postData = new URLSearchParams({
      To: to,
      MessagingServiceSid: messagingServiceSid,
      Body: body,
    }).toString();

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: postData,
      }
    );

    const data = await twilioRes.json();
    return res.status(twilioRes.status).json(data);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Server error' });
  }
}
