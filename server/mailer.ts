import 'dotenv/config';
import nodemailer from 'nodemailer';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_APP_PASSWORD = process.env.EMAIL_APP_PASSWORD;

if (!EMAIL_USER || !EMAIL_APP_PASSWORD) {
  throw new Error('EMAIL_USER or EMAIL_APP_PASSWORD is not set in .env');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_APP_PASSWORD,
  },
});

export const sendMail = async (to: string, subject: string, html: string) => {
  await transporter.sendMail({
    from: EMAIL_USER,
    to,
    subject,
    html,
  });
};
