# french_tutor

Website for french tutoring services offered by Dr. Taju Hammid.

A single static page (`index.html`) with one Netlify function that emails
booking enquiries to Dr. Taju.

## Enquiry form

Every enquiry is written to two places at once:

- **Netlify Forms** keeps the durable record. Submissions are listed under
  Site configuration → Forms, so nothing is lost even if the email fails.
- **`/.netlify/functions/send-enquiry`** emails the enquiry to Dr. Taju via
  [Resend](https://resend.com). The API key lives in a Netlify environment
  variable, so it is never served to the browser.

The two are independent. The visitor sees a confirmation if *either* succeeds,
and only sees an error if both fail — at which point nothing was recorded, so
the error tells them to use WhatsApp instead.

### Setup

1. **Create a Resend account** and add an API key.

2. **Verify a sending domain** in Resend (Domains → Add Domain) and add the DNS
   records it gives you. Until a domain is verified, Resend will only deliver to
   the address that owns the Resend account — so a test may reach you while a
   real visitor's enquiry silently fails.

3. **Set three environment variables** in Netlify
   (Site configuration → Environment variables):

   | Variable | Value |
   | --- | --- |
   | `RESEND_API_KEY` | the key from Resend |
   | `MAIL_TO` | `tajuhammid4@gmail.com` |
   | `MAIL_FROM` | a verified sender, e.g. `Website <enquiries@yourdomain.com>` |

   `MAIL_FROM` must be on the domain verified in step 2. It cannot be the Gmail
   address — Gmail does not authorise Resend to send as it, so those messages
   are rejected or land in spam.

4. **Redeploy.** Functions pick up environment variables at deploy time, so
   changing a variable needs a new deploy to take effect.

If any variable is missing the form fails safely: the visitor is told the form
is not configured and pointed at WhatsApp, and the reason is written to the
function log (Netlify → Logs → Functions).

### Email notifications on the form

Netlify can also email on each submission (Forms → Settings → Form
notifications). Worth turning on: it is the only thing that tells Dr. Taju an
enquiry arrived when Resend is down. The cost is that a working setup sends two
emails per enquiry — the Resend one, formatted and replyable, and Netlify's
plainer notification. If that becomes annoying, turn the notification off and
rely on checking the Forms dashboard when something looks wrong.

Netlify's free tier covers 100 submissions a month.

### Notes

- Replies go to the student. The email sets `reply_to` to the address they
  entered, so replying in Gmail reaches them directly.
- Spam is filtered by a honeypot field. Bots that fill the hidden `company`
  field get a normal-looking success response and no email is sent.
- The form still works with JavaScript disabled. Without JS the browser posts
  it normally, Netlify Forms records it, and the visitor lands on Netlify's own
  confirmation page rather than the styled one.
- Netlify detects forms by parsing the deployed HTML at build time, so the
  `data-netlify` attribute and the hidden `form-name` input must stay on the
  form markup. Removing either silently stops submissions being recorded.
