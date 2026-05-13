const mongoose = require("mongoose");
require("dotenv").config();

const { repairProvidersCollection } = require("../utils/repairProvidersCollection");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("❌ MONGO_URI is not set");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB Connected Successfully");
    await repairProvidersCollection();
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
