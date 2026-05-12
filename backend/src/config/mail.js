const nodemailer = require("nodemailer");

/**
 * Gmail / Google Workspace: use an App Password (2FA required), not the normal login password.
 * Env: EMAIL_USER, EMAIL_PASS (app password), optional EMAIL_FROM (defaults to EMAIL_USER).
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
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const transport = createMailTransport();
  if (!transport) {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
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
