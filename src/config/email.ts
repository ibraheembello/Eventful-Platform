import nodemailer from 'nodemailer';

const isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  transporter.verify()
    .then(() => console.log('Email transporter connected'))
    .catch((err) => console.warn('Email transporter verification failed:', err.message));
} else {
  console.log('Email is not configured - running without email notifications');
}

export const emailFrom = process.env.SMTP_FROM || 'Eventful <noreply@eventful-platform.com>';

export default transporter;
