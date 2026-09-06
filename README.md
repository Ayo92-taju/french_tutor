# french_tutor

Website for french tutoring services offered by Dr. Taju Hammid.

A single static page (`index.html`) with one Netlify function that emails
booking enquiries to Dr. Taju.

## Enquiry form

`index.html` posts the form to `/.netlify/functions/send-enquiry`, which sends
the enquiry on via [Resend](https://resend.com). The API key lives in a Netlify
environment variable, so it is never served to the browser.

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

### Notes

- Replies go to the student. The email sets `reply_to` to the address they
  entered, so replying in Gmail reaches them directly.
- Spam is filtered by a honeypot field. Bots that fill the hidden `company`
  field get a normal-looking success response and no email is sent.
- Submissions are not stored anywhere. If an email fails to send, that enquiry
  is lost — which is the trade-off for not keeping a third-party copy.
