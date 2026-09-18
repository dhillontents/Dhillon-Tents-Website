import { createHash } from 'node:crypto';

// Vercel Node function. Credentials belong in Vercel environment variables only.
// This recipient is fixed: visitors cannot turn the form into an email relay.
const RECIPIENT = 'dhillontents@gmail.com';
const attempts = new Map();
const WINDOW = 10 * 60 * 1000;
const emailPattern = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use the contact form to send a request.' });
  }
  if (!/^application\/json\b/i.test(req.headers['content-type'] || '')) {
    return res.status(415).json({ error: 'Please reload the contact page and try again.' });
  }
  // Reject cross-site browser submissions; this is not a substitute for rate limits.
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) throw new Error();
    } catch {
      return res.status(403).json({ error: 'Send your request from this website.' });
    }
  }
  let body;
  try {
    if (Number(req.headers['content-length']) > 24000) throw new Error();
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw || Buffer.byteLength(raw) > 24000) throw new Error();
    body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
  } catch {
    return res.status(400).json({ error: 'The request is too large or invalid. Please shorten your notes and try again.' });
  }
  if (body.website) return res.status(400).json({ error: 'Please reload the form and try again.' });
  const { name, email, message, requestId } = body;
  if (typeof name !== 'string' || !name.trim() || name.length > 120 || /[\r\n\x00-\x1f]/.test(name) ||
      typeof email !== 'string' || email.length > 254 || !emailPattern.test(email.trim()) ||
      typeof message !== 'string' || message.length < 20 || message.length > 14000 ||
      typeof requestId !== 'string' || !/^[a-zA-Z0-9-]{16,80}$/.test(requestId)) {
    return res.status(400).json({ error: 'Enter your name and a valid email address, and keep your notes under 3,000 characters.' });
  }
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from || /[\r\n]/.test(from)) {
    console.error('contact: missing or invalid email configuration');
    return res.status(503).json({ error: 'Online sending is not ready. Please use WhatsApp or email dhillontents@gmail.com.' });
  }
  // Best-effort per-instance throttle. Configure a Vercel Firewall rate-limit
  // rule for /api/contact for a distributed production limit if abuse occurs.
  const now = Date.now();
  for (const [ip, entry] of attempts) if (entry.until <= now) attempts.delete(ip);
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const entry = attempts.get(ip) || { count: 0, until: now + WINDOW };
  if (entry.count >= 5) {
    res.setHeader('Retry-After', String(Math.ceil((entry.until - now) / 1000)));
    return res.status(429).json({ error: 'Too many requests. Please wait 10 minutes or contact us on WhatsApp.' });
  }
  entry.count += 1;
  // Cap process memory; this map is intentionally not a durable global limiter.
  if (attempts.size >= 5000) attempts.delete(attempts.keys().next().value);
  attempts.set(ip, entry);
  const payload = {
    from,
    to: [RECIPIENT],
    reply_to: email.trim(),
    subject: 'Dhillon Tents quote request - ' + name.trim(),
    text: 'Website quote request\nCustomer: ' + name.trim() + '\nReply email: ' + email.trim() + '\n\n' + message + '\n\nThis is an inquiry, not a confirmed booking.'
  };
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  try {
    const result = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'quote-' + requestId + '-' + digest },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
    const data = await result.json();
    if (!result.ok || !data.id) {
      console.error('contact: email provider rejected request', result.status);
      return res.status(502).json({ error: 'We could not submit your request. Your details are saved; please retry or use WhatsApp.' });
    }
    return res.status(200).json({ ok: true });
  } catch {
    console.error('contact: email provider unavailable or timed out');
    return res.status(502).json({ error: 'We could not confirm submission. Your details are saved; please retry or contact us on WhatsApp.' });
  }
}
