/**
 * Receives the booking enquiry and emails it to Dr. Taju via Resend.
 *
 * Runs on Netlify, so the API key stays in an environment variable and never
 * reaches the browser. Configure in Netlify → Site settings → Environment:
 *   RESEND_API_KEY  the key from resend.com
 *   MAIL_TO         where enquiries land, e.g. tajuhammid4@gmail.com
 *   MAIL_FROM       a verified sender, e.g. "Website <enquiries@yourdomain.com>"
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const MAX_FIELD = 2000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' }
  });

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const clean = (value) => String(value ?? '').trim().slice(0, MAX_FIELD);

export default async (request) => {
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  let payload;
  try {
    const contentType = request.headers.get('content-type') || '';
    payload = contentType.includes('application/json')
      ? await request.json()
      : Object.fromEntries(await request.formData());
  } catch {
    return json({ error: 'Could not read that submission.' }, 400);
  }

  // Honeypot. People never see this field; bots fill it in. Answer 200 so the
  // bot believes it succeeded and does not retry.
  if (clean(payload.company)) return json({ ok: true }, 200);

  const firstName = clean(payload.fname);
  const lastName = clean(payload.lname);
  const email = clean(payload.email);
  const phone = clean(payload.phone);
  const goal = clean(payload.goal);
  const message = clean(payload.message);

  // Never trust the browser's validation — re-check here.
  const missing = [];
  if (!firstName) missing.push('a first name');
  if (!EMAIL_RE.test(email)) missing.push('a valid email address');
  if (!goal) missing.push('a goal');
  if (missing.length) return json({ error: `Please provide ${missing.join(', ')}.` }, 400);

  const { RESEND_API_KEY, MAIL_TO, MAIL_FROM } = process.env;
  if (!RESEND_API_KEY || !MAIL_TO || !MAIL_FROM) {
    console.error('Missing RESEND_API_KEY, MAIL_TO or MAIL_FROM in the environment.');
    return json({ error: 'The enquiry form is not configured yet. Please use WhatsApp for now.' }, 500);
  }

  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  const rows = [
    ['Name', fullName],
    ['Email', email],
    ['Phone', phone || '—'],
    ['Goal', goal],
    ['Message', message || '—']
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
  const html = `<table cellpadding="6" style="border-collapse:collapse;font:14px/1.6 system-ui,sans-serif">
${rows.map(([label, value]) => `  <tr>
    <td style="vertical-align:top;color:#4A5568">${escapeHtml(label)}</td>
    <td style="vertical-align:top;color:#0F2340"><strong>${escapeHtml(value).replace(/\n/g, '<br>')}</strong></td>
  </tr>`).join('\n')}
</table>`;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: MAIL_TO,
        // So replying in his mail client goes straight back to the student.
        reply_to: email,
        subject: `New enquiry from ${fullName} — ${goal}`,
        text,
        html
      })
    });

    if (!response.ok) {
      // Log the detail for us; tell the visitor nothing that leaks configuration.
      console.error('Resend rejected the send:', response.status, await response.text());
      return json({ error: 'We could not send that just now. Please try WhatsApp instead.' }, 502);
    }
  } catch (error) {
    console.error('Could not reach Resend:', error);
    return json({ error: 'We could not send that just now. Please try WhatsApp instead.' }, 502);
  }

  return json({ ok: true }, 200);
};
