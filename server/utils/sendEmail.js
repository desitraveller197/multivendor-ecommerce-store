const nodemailer = require('nodemailer');

/**
 * Send an email via the configured SMTP transport.
 * If EMAIL_USER is not set, logs to the console and skips sending — handy in dev.
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.EMAIL_USER) {
    console.log('────────── [DEV EMAIL — not sent] ──────────');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:    ${text || html}`);
    console.log('────────────────────────────────────────────');
    return { skipped: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // STARTTLS on 587
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    text,
    html,
  });
}

module.exports = sendEmail;
