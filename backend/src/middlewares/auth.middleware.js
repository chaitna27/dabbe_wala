const jwt = require("jsonwebtoken");

/**
 * Attaches a normalized auth user: { id: string, role: string }.
 * JWT is issued with `id` (see auth.controller); this also accepts common aliases.
 */
module.exports = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !String(authHeader).startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rawId = decoded.id ?? decoded.userId ?? decoded.user_id ?? decoded.sub;
    if (rawId === undefined || rawId === null || String(rawId).trim() === "") {
      return res.status(401).json({ message: "Invalid token payload" });
    }
    req.user = {
      id: String(rawId),
      role: decoded.role,
    };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
