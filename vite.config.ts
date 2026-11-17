import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

function twilioDevProxyPlugin(env: Record<string, string>) {
  const accountSid = env.TWILIO_ACCOUNT_SID || env.VITE_TWILIO_ACCOUNT_SID || process.env.TWILIO_ACCOUNT_SID || '';
  const authToken = env.TWILIO_AUTH_TOKEN || env.VITE_TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN || '';
  const messagingServiceSid = env.TWILIO_MESSAGING_SERVICE_SID || env.VITE_TWILIO_MESSAGING_SERVICE_SID || process.env.TWILIO_MESSAGING_SERVICE_SID || '';

  return {
    name: 'twilio-dev-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/send-sms', (req: any, res: any) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const parsed = JSON.parse(body || '{}');
            const { to, body: smsText } = parsed;

            if (!to || !smsText) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Missing to or body' }));
              return;
            }

            const postData = new URLSearchParams({
              To: to,
              MessagingServiceSid: messagingServiceSid,
              Body: smsText,
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
            res.statusCode = twilioRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'Server error' }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), twilioDevProxyPlugin(env)],
    server: {
      host: true,
      allowedHosts: true,
    },
    preview: {
      host: true,
      allowedHosts: true,
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
