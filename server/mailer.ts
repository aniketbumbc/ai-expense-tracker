import 'dotenv/config';
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Resend's shared test sender — works without a verified domain, but only
// delivers to the email address that owns the API key's Resend account.
const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev';

if (!RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not set in .env');
}

const resend = new Resend(RESEND_API_KEY);

export const sendMail = async (to: string, subject: string, html: string) => {
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Resend error: ${error.name} - ${error.message}`);
  }
};

// Confirms the Resend API key is valid without sending an email.
// Useful for checking a deployment's RESEND_API_KEY (e.g. Railway) since a
// bad/missing key otherwise only surfaces as a silently-swallowed error on
// the first real send.
export const verifyMailTransport = async () => {
  const { error } = await resend.apiKeys.list();
  if (error) {
    throw new Error(`Resend error: ${error.name} - ${error.message}`);
  }
};
