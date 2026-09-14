const nodemailer = require('nodemailer');

function buildTransport() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
}

async function sendResultEmail(to, subject, text) {
  const transporter = buildTransport();
  if (!transporter) {
    throw new Error("Email yuborish sozlanmagan. .env faylida SMTP ma'lumotlarini to'ldiring.");
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
  });
}

module.exports = { sendResultEmail };
