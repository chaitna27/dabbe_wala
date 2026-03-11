const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/* ======================
   REGISTER
====================== */
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Insert user
    db.query(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, role],
      (err, userResult) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email already exists" });
          }
          return res.status(500).json(err);
        }

        const userId = userResult.insertId;

        // 2️⃣ If PROVIDER → insert into providers table
        if (role === "provider") {
          db.query(
            `INSERT INTO providers (user_id, kitchen_name, location, veg_only, is_verified)
             VALUES (?, ?, ?, 0, 1)`,
            [userId, `${name}'s Kitchen`, "Near Hostel Road"],
            (err) => {
              if (err) return res.status(500).json(err);
              res.status(201).json({ message: "Provider registered successfully" });
            }
          );
        } else {
          // Student
          res.status(201).json({ message: "Student registered successfully" });
        }
      }
    );
  } catch (err) {
    res.status(500).json(err);
  }
};

/* ======================
   LOGIN
====================== */
exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, users) => {
      if (err) return res.status(500).json(err);
      if (users.length === 0)
        return res.status(401).json({ message: "Invalid credentials" });

      const user = users[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match)
        return res.status(401).json({ message: "Invalid credentials" });
      
      if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing");
      return res.status(500).json({ message: "Server config error" });
}

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      });
    }
  );
};


/* ======================
   FORGOT PASSWORD (SECURE)
====================== */
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  const crypto = require("crypto");

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  db.query(
    `
    UPDATE users
    SET reset_token = ?, reset_token_expiry = ?
    WHERE email = ?
    `,
    [hashedToken, expiry, email],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Email not found" });
      }

      const transporter = require("nodemailer").createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const resetLink = `http://localhost:5173/reset-password/${rawToken}`;

      transporter.sendMail({
        to: email,
        subject: "Reset your DabbeWala password",
        html: `
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">${resetLink}</a>
          <p>This link expires in 15 minutes.</p>
        `,
      });

      res.json({ message: "Password reset link sent" });
    }
  );
};

/* ======================
   RESET PASSWORD (SECURE)
====================== */
exports.resetPassword = async (req, res) => {
  const crypto = require("crypto");
  const bcrypt = require("bcryptjs");

  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    return res.status(400).json({ message: "Password too short" });
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const hashedPassword = await bcrypt.hash(password, 10);

  db.query(
    `
    UPDATE users
    SET password = ?, reset_token = NULL, reset_token_expiry = NULL
    WHERE reset_token = ?
      AND reset_token_expiry > NOW()
    `,
    [hashedPassword, hashedToken],
    (err, result) => {
      if (err) return res.status(500).json(err);

      if (result.affectedRows === 0) {
        return res.status(400).json({
          message: "Invalid or expired reset link",
        });
      }

      res.json({ message: "Password reset successful" });
    }
  );
};
