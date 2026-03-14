const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config();
require("./src/config/db");

const authRoutes = require("./src/routes/auth.routes");
const menuRoutes = require("./src/routes/menu.routes");
const orderRoutes = require("./src/routes/order.routes");
const reviewRoutes = require("./src/routes/review.routes");
const providerRoutes = require("./src/routes/provider.routes");
const subscriptionRoutes = require("./src/routes/subscription.routes");

const app = express();
const allowedOrigins = [
  "http://localhost:5173",
  "https://dabbe-wala.vercel.app"
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/providers", providerRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

app.use("/uploads", express.static("uploads"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

