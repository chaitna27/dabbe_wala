const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Provider = require("../models/Provider");
const {
  sendPasswordResetEmail,
  getEmailCredentials,
  isMailConfigured,
} = require("../config/mail");

function maskEmail(email) {
  if (!email || !String(email).includes("@")) return "<missing>";
  const [name, domain] = String(email).split("@");
  return `${name.slice(0, 2)}***@${domain}`;
}

function logForgotPassword(requestId, step, details = {}) {
  console.log(`[forgot-password:${requestId}] ${step}`, details);
}

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  const allowedRoles = ["student", "provider", "admin"];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const existingUser = await User.findOne({
      email: String(email).toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: String(email).toLowerCase().trim(),
      password: hashedPassword,
      role,
    });

    if (role === "provider") {
      await Provider.create({
        user: user._id,
        kitchenName: `${name.trim()}'s Kitchen`,
        location: "Near Hostel Road",
        latitude: null,
        longitude: null,
        vegOnly: false,
        isVerified: true,
        isActive: true,
        phone: "",
        whatsapp: "",
      });

      return res.status(201).json({
        message: "Provider registered successfully",
      });
    }

    const message =
      role === "admin"
        ? "Registered successfully"
        : "Student registered successfully";

    return res.status(201).json({
      message,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Email already exists" });
    }
    return res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password required" });
  }

  try {
    const user = await User.findOne({
      email: String(email).toLowerCase().trim(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server misconfiguration" });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("login:", err);
    return res.status(500).json({
      message: "Login failed",
      error: err.message,
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("name email role address");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || "",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.patchMe = async (req, res) => {
  const { address } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (address !== undefined) {
      user.address = String(address).trim();
    }
    await user.save();
    return res.json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      address: user.address || "",
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const requestId = crypto.randomBytes(4).toString("hex");

  logForgotPassword(requestId, "request received", {
    hasEmail: Boolean(email),
  });

  if (!email) {
    logForgotPassword(requestId, "validation failed", {
      reason: "missing email",
    });
    return res.status(400).json({ message: "Email required" });
  }

  const normalized = String(email).toLowerCase().trim();
  const creds = getEmailCredentials();
  const mailConfigured = isMailConfigured();
  const devLinkResponse =
    process.env.ALLOW_RESET_LINK_IN_RESPONSE === "true" ||
    process.env.ALLOW_RESET_LINK_IN_RESPONSE === "1";

  logForgotPassword(requestId, "mail configuration checked", {
    provider: creds.provider,
    emailUser: maskEmail(creds.user),
    emailPassPresent: Boolean(creds.pass),
    emailFrom: maskEmail(creds.from),
    resendApiKeyPresent: Boolean(creds.resendApiKey),
    mailConfigured,
    devLinkResponse,
  });

  if (!mailConfigured) {
    if (!devLinkResponse) {
      logForgotPassword(requestId, "mail not configured");
      return res.status(503).json({
        message:
          "Password reset email is not configured. For Gmail, set EMAIL_USER and EMAIL_PASS. For Resend, set MAIL_PROVIDER=resend, RESEND_API_KEY, and EMAIL_FROM. For local testing only, set ALLOW_RESET_LINK_IN_RESPONSE=true to receive resetLink in the JSON response.",
      });
    }
  }

  try {
    logForgotPassword(requestId, "looking up user", {
      email: maskEmail(normalized),
    });
    const user = await User.findOne({ email: normalized });
    if (!user) {
      logForgotPassword(requestId, "user not found", {
        email: maskEmail(normalized),
      });
      return res.status(404).json({ message: "Email not found" });
    }

    logForgotPassword(requestId, "user found", {
      userId: user._id.toString(),
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await User.findByIdAndUpdate(user._id, {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    });

    logForgotPassword(requestId, "reset token saved", {
      userId: user._id.toString(),
      expiresAt: expiry.toISOString(),
    });

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
      /\/$/,
      "",
    );
    const resetLink = `${frontendBase}/reset-password/${rawToken}`;

    logForgotPassword(requestId, "reset link generated", {
      frontendBase,
    });

    if (!mailConfigured) {
      logForgotPassword(requestId, "returning dev reset link");
      return res.json({
        message:
          "Development mode: password reset link generated (email not configured).",
        devResetLink: resetLink,
      });
    }

    try {
      logForgotPassword(requestId, "sending reset email", {
        provider: creds.provider,
        to: maskEmail(normalized),
      });
      await sendPasswordResetEmail(normalized, resetLink);
      logForgotPassword(requestId, "reset email sent");
    } catch (mailErr) {
      console.error(`[forgot-password:${requestId}] mail send failed`, {
        name: mailErr.name,
        code: mailErr.code,
        command: mailErr.command,
        responseCode: mailErr.responseCode,
        statusCode: mailErr.statusCode,
        message: mailErr.message,
      });
      await User.findByIdAndUpdate(user._id, {
        resetToken: null,
        resetTokenExpiry: null,
      });
      logForgotPassword(requestId, "reset token cleared after mail failure", {
        userId: user._id.toString(),
      });
      return res.status(502).json({
        message:
          mailErr.message ||
          "Could not send password reset email. Check the configured email provider credentials and network access.",
      });
    }

    const payload = { message: "Password reset link sent" };
    if (devLinkResponse) {
      payload.devResetLink = resetLink;
    }
    logForgotPassword(requestId, "response sent", {
      devLinkIncluded: Boolean(payload.devResetLink),
    });
    return res.json(payload);
  } catch (err) {
    console.error(`[forgot-password:${requestId}] failed`, {
      name: err.name,
      code: err.code,
      message: err.message,
    });
    return res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  const token = req.params.token || req.body.token;
  const { password } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Reset token required" });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password too short" });
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  try {
    const user = await User.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: new Date() },
    }).select("+password +resetToken +resetTokenExpiry");

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link",
      });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
