const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Provider = require("../models/Provider");
const { sendPasswordResetEmail, getEmailCredentials } = require("../config/mail");

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
        userId: user._id,
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

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const normalized = String(email).toLowerCase().trim();
  const creds = getEmailCredentials();
  const devLinkResponse =
    process.env.ALLOW_RESET_LINK_IN_RESPONSE === "true" ||
    process.env.ALLOW_RESET_LINK_IN_RESPONSE === "1";

  if (!creds.user || !creds.pass) {
    if (!devLinkResponse) {
      return res.status(503).json({
        message:
          "Password reset email is not configured. Set EMAIL_USER and EMAIL_PASS (16-character Gmail App Password, not your normal password). For local testing only, set ALLOW_RESET_LINK_IN_RESPONSE=true to receive resetLink in the JSON response.",
      });
    }
  }

  try {
    const user = await User.findOne({ email: normalized });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }

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

    const frontendBase = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
      /\/$/,
      "",
    );
    const resetLink = `${frontendBase}/reset-password/${rawToken}`;

    if (!creds.user || !creds.pass) {
      return res.json({
        message:
          "Development mode: password reset link generated (email not configured).",
        devResetLink: resetLink,
      });
    }

    try {
      await sendPasswordResetEmail(normalized, resetLink);
    } catch (mailErr) {
      console.error("forgotPassword mail:", mailErr);
      await User.findByIdAndUpdate(user._id, {
        resetToken: null,
        resetTokenExpiry: null,
      });
      return res.status(502).json({
        message:
          mailErr.message ||
          "Could not send email. Confirm Gmail App Password (16 characters) and that 'Less secure app access' is not required—use App Passwords with 2FA.",
      });
    }

    const payload = { message: "Password reset link sent" };
    if (devLinkResponse) {
      payload.devResetLink = resetLink;
    }
    return res.json(payload);
  } catch (err) {
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
