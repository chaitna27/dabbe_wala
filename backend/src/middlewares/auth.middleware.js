const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // must contain id + role
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};






