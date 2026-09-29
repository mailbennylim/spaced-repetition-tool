/**
 * Cloudflare Email Worker: forwards inbound mail to the app as JSON.
 * Set up: Cloudflare → Email Routing → catch-all (or *@library.<domain> and *@feed.<domain>) → this Worker.
 * Worker variables: APP_URL (e.g. https://reader.example.com), INBOUND_EMAIL_SECRET (same as the app's .env).
 */
import PostalMime from 'postal-mime';

export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await new PostalMime().parse(raw);
    const res = await fetch(`${env.APP_URL}/api/inbound/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.INBOUND_EMAIL_SECRET}` },
      body: JSON.stringify({
        to: message.to,
        from: parsed.from?.address || message.from,
        fromName: parsed.from?.name || '',
        subject: parsed.subject || '',
        html: parsed.html || '',
        text: parsed.text || '',
        date: parsed.date || new Date().toISOString(),
      }),
    });
    if (!res.ok && res.status !== 404) message.setReject(`Reader could not store this email (${res.status})`);
  },
};
