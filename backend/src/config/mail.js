const nodemailer = require("nodemailer");
const https = require("https");

const MAIL_PROVIDER = (
  process.env.MAIL_PROVIDER ||
  process.env.EMAIL_PROVIDER ||
  "gmail"
).toLowerCase();

function maskEmail(email) {
  if (!email || !String(email).includes("@")) return "<missing>";
  const [name, domain] = String(email).split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function logMailStep(step, details = {}) {
  console.log(`[mail] ${step}`, details);
}

function getEmailCredentials() {
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.replace(/\s/g, "").trim();
  const from = process.env.EMAIL_FROM?.trim() || user;
  const resendApiKey = process.env.RESEND_API_KEY?.trim();

  return {
    provider: MAIL_PROVIDER,
    user,
    pass,
    from,
    resendApiKey,
  };
}

function isMailConfigured() {
  const { provider, user, pass, from, resendApiKey } = getEmailCredentials();
  if (provider === "resend") return Boolean(resendApiKey && from);
  return Boolean(user && pass);
}

function createMailTransport() {
  const { user, pass } = getEmailCredentials();

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    auth: {
      user,
      pass,
    },
  });
}

function buildResetEmail(toEmail, resetUrl, from) {
  return {
    from: from.includes("<") ? from : `"DabbeWala" <${from}>`,
    to: toEmail,
    subject: "Reset your DabbeWala Password",
    text: `Reset your password using the link below:\n\n${resetUrl}\n\nThis link expires in 15 minutes.`,
    html: `
      <h2>DabbeWala Password Reset</h2>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}"
         style="
           display:inline-block;
           padding:10px 20px;
           background:#d95a1a;
           color:white;
           text-decoration:none;
           border-radius:5px;
         ">
         Reset Password
      </a>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `,
  };
}

function postJson(url, headers, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
          ...headers,
        },
      },
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = data;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
      },
    );

    req.setTimeout(20000, () => {
      req.destroy(new Error("EMAIL_HTTP_TIMEOUT"));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendWithResend(message, apiKey) {
  logMailStep("resend send start", {
    to: maskEmail(message.to),
    from: message.from,
  });

  const result = await postJson(
    "https://api.resend.com/emails",
    { Authorization: `Bearer ${apiKey}` },
    {
      from: message.from,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      html: message.html,
    },
  );

  if (result.statusCode < 200 || result.statusCode >= 300) {
    const err = new Error(
      `RESEND_SEND_FAILED: ${result.statusCode} ${JSON.stringify(result.body)}`,
    );
    err.code = "RESEND_SEND_FAILED";
    err.statusCode = result.statusCode;
    throw err;
  }

  logMailStep("resend send success", {
    id: result.body?.id || null,
    statusCode: result.statusCode,
  });
}

async function sendWithGmail(message) {
  const transport = createMailTransport();

  if (!transport) {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  logMailStep("gmail send start", {
    to: maskEmail(message.to),
    from: message.from,
    verifySkipped: true,
  });

  const info = await transport.sendMail(message);

  logMailStep("gmail send success", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const { provider, user, pass, from, resendApiKey } = getEmailCredentials();

  logMailStep("config", {
    provider,
    emailUser: maskEmail(user),
    emailPassPresent: Boolean(pass),
    emailFrom: from ? maskEmail(from.replace(/^.*<|>$/g, "")) : "<missing>",
    resendApiKeyPresent: Boolean(resendApiKey),
  });

  if (!isMailConfigured()) {
    const err = new Error("EMAIL_NOT_CONFIGURED");
    err.code = "EMAIL_NOT_CONFIGURED";
    throw err;
  }

  const message = buildResetEmail(toEmail, resetUrl, from);

  try {
    if (provider === "resend") {
      await sendWithResend(message, resendApiKey);
      return;
    }

    await sendWithGmail(message);
  } catch (err) {
    logMailStep("send failed", {
      provider,
      code: err.code,
      command: err.command,
      responseCode: err.responseCode,
      message: err.message,
    });
    throw err;
  }
}

module.exports = {
  createMailTransport,
  getEmailCredentials,
  isMailConfigured,
  sendPasswordResetEmail,
};
