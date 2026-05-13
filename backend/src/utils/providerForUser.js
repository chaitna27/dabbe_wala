const mongoose = require("mongoose");
const Provider = require("../models/Provider");
const User = require("../models/User");

function toObjectId(userId) {
  if (userId === undefined || userId === null || String(userId).trim() === "") {
    return null;
  }
  if (!mongoose.isValidObjectId(userId)) return null;
  return typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
}

/** Canonical link: Provider.user → User._id (legacy keys removed at startup by repairProvidersCollection). */
function providerMatch(userId) {
  const uid = toObjectId(userId);
  if (!uid) return null;
  return { user: uid };
}

async function findProviderForUser(userId) {
  const q = providerMatch(userId);
  if (!q) return null;
  return Provider.findOne(q);
}

/**
 * Returns the provider linked to this auth user, creating a sensible default
 * profile if none exists.
 */
async function ensureProviderForUser(userId) {
  const uid = toObjectId(userId);
  if (!uid) {
    console.error("[ensureProviderForUser] missing or invalid user id:", userId);
    return null;
  }

  let provider = await Provider.findOne(providerMatch(userId));
  if (provider) return provider;

  const user = await User.findById(uid).select("name");
  if (!user) {
    console.error("[ensureProviderForUser] no User row for id:", uid.toString());
    return null;
  }

  const name = (user.name || "Kitchen").trim() || "Kitchen";

  try {
    console.log("[ensureProviderForUser] creating Provider for user:", uid.toString());
    provider = await Provider.create({
      user: uid,
      kitchenName: `${name}'s Kitchen`,
      location: "",
      latitude: null,
      longitude: null,
      vegOnly: false,
      isVerified: true,
      isActive: true,
      phone: "",
      whatsapp: "",
    });
  } catch (err) {
    if (err.code === 11000) {
      provider = await Provider.findOne(providerMatch(userId));
      if (provider) return provider;
    }
    console.error("[ensureProviderForUser] create failed:", err.message);
    throw err;
  }

  return provider;
}

module.exports = {
  toObjectId,
  providerMatch,
  findProviderForUser,
  ensureProviderForUser,
};
