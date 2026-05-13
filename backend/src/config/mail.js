const nodemailer = require("nodemailer");

/**
 * Gmail: use an App Password (Google Account → Security → 2-Step Verification → App passwords).
 * Never use your normal Gmail password here.
 * Env: EMAIL_USER, EMAIL_PASS (16-char app password, spaces optional), optional EMAIL_FROM.
 */
function getEmailCredentials() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "").trim();
  return { user, pass };
}

function createMailTransport() {
  const { user, pass } = getEmailCredentials();
  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: true,
    },
  });
}

/**
 * Verifies SMTP auth (catches wrong password / non–app-password / blocked sign-in).
 */
async function sendPasswordResetEmail(toEmail, resetUrl) {
  const transport = createMailTransport();
  if (!transport) {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  try {
    await transport.verify();
  } catch (e) {
    const wrap = new Error(
      "Gmail SMTP verification failed. Use a 16-character App Password (not your normal password), with 2FA enabled on the Google account.",
    );
    wrap.cause = e;
    throw wrap;
  }

  const from =
    process.env.EMAIL_FROM?.trim() || getEmailCredentials().user;

  await transport.sendMail({
    from: `"DabbeWala" <${from}>`,
    to: toEmail,
    subject: "Reset your DabbeWala password",
    text: `Reset your password (valid 15 minutes):\n${resetUrl}\n\nIf you did not request this, ignore this email.`,
    html: `
      <p>Click below to reset your password:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>This link expires in 15 minutes.</p>
    `,
  });
}

module.exports = {
  createMailTransport,
  getEmailCredentials,
  sendPasswordResetEmail,
};
