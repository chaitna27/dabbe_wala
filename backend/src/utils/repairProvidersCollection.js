/**
 * One-time / startup repair for the `providers` collection.
 * Normalizes mixed legacy shapes (snake_case + userId/user_id) into the
 * canonical Mongoose schema (camelCase + `user`), dedupes, drops bad indexes.
 */

const mongoose = require("mongoose");

const LEGACY_UNSET = {
  user_id: "",
  userId: "",
  kitchen_name: "",
  veg_only: "",
  is_verified: "",
  is_active: "",
};

async function dropLegacyUserIndexes(col) {
  const indexes = await col.indexes();
  for (const idx of indexes) {
    const name = idx.name;
    if (!name || name === "_id_") continue;
    const key = idx.key || {};
    const keys = Object.keys(key);
    const onlyLegacySnake = keys.length === 1 && keys[0] === "user_id";
    const onlyLegacyCamel = keys.length === 1 && keys[0] === "userId";
    const badName = name === "user_id_1" || name === "userId_1";
    if (badName || onlyLegacySnake || onlyLegacyCamel) {
      try {
        await col.dropIndex(name);
        console.log(`✅ Provider repair: dropped legacy index "${name}"`);
      } catch (e) {
        console.warn(`Provider repair: could not drop index "${name}":`, e.message);
      }
    }
  }
}

async function dedupeProvidersByUser(col) {
  const dupGroups = await col
    .aggregate([
      { $match: { user: { $type: "objectId" } } },
      {
        $group: {
          _id: "$user",
          ids: { $push: "$_id" },
          n: { $sum: 1 },
        },
      },
      { $match: { n: { $gt: 1 } } },
    ])
    .toArray();

  let removed = 0;
  for (const g of dupGroups) {
    const ids = g.ids.map((id) => id).sort((a, b) => String(a).localeCompare(String(b)));
    const [, ...rest] = ids;
    if (rest.length === 0) continue;
    const r = await col.deleteMany({ _id: { $in: rest } });
    removed += r.deletedCount;
  }
  if (removed > 0) {
    console.log(`✅ Provider repair: removed ${removed} duplicate provider document(s) (same user)`);
  }
}

async function repairProvidersCollection() {
  try {
    const db = mongoose.connection.db;
    if (!db) return;
    const col = db.collection("providers");

    // --- Link user (canonical: `user`) ---
    const copyUserId = await col.updateMany(
      {
        userId: { $exists: true },
        $or: [{ user: { $exists: false } }, { user: null }],
      },
      [{ $set: { user: "$userId" } }],
    );
    if (copyUserId.modifiedCount > 0) {
      console.log(`✅ Provider repair: userId → user (${copyUserId.modifiedCount})`);
    }

    const copyUser_id = await col.updateMany(
      {
        user_id: { $exists: true },
        $or: [{ user: { $exists: false } }, { user: null }],
      },
      [{ $set: { user: "$user_id" } }],
    );
    if (copyUser_id.modifiedCount > 0) {
      console.log(`✅ Provider repair: user_id → user (${copyUser_id.modifiedCount})`);
    }

    // --- CamelCase field copies ---
    const copyKitchen = await col.updateMany(
      {
        kitchen_name: { $exists: true, $nin: [null, ""] },
        $or: [{ kitchenName: { $exists: false } }, { kitchenName: null }, { kitchenName: "" }],
      },
      [{ $set: { kitchenName: "$kitchen_name" } }],
    );
    if (copyKitchen.modifiedCount > 0) {
      console.log(`✅ Provider repair: kitchen_name → kitchenName (${copyKitchen.modifiedCount})`);
    }

    const copyVeg = await col.updateMany(
      { veg_only: { $exists: true }, vegOnly: { $exists: false } },
      [{ $set: { vegOnly: "$veg_only" } }],
    );
    if (copyVeg.modifiedCount > 0) {
      console.log(`✅ Provider repair: veg_only → vegOnly (${copyVeg.modifiedCount})`);
    }

    const copyVerified = await col.updateMany(
      { is_verified: { $exists: true }, isVerified: { $exists: false } },
      [{ $set: { isVerified: "$is_verified" } }],
    );
    if (copyVerified.modifiedCount > 0) {
      console.log(`✅ Provider repair: is_verified → isVerified (${copyVerified.modifiedCount})`);
    }

    const copyActive = await col.updateMany(
      {
        is_active: { $exists: true },
        $or: [{ isActive: { $exists: false } }, { isActive: null }],
      },
      [{ $set: { isActive: "$is_active" } }],
    );
    if (copyActive.modifiedCount > 0) {
      console.log(`✅ Provider repair: is_active → isActive (${copyActive.modifiedCount})`);
    }

    await dedupeProvidersByUser(col);

    const delRes = await col.deleteMany({
      $or: [
        { user: null },
        { user: { $exists: false } },
        { $nor: [{ user: { $type: "objectId" } }] },
      ],
    });
    if (delRes.deletedCount > 0) {
      console.log(
        `✅ Provider repair: deleted ${delRes.deletedCount} invalid provider(s) (missing user)`,
      );
    }

    await col.updateMany({}, { $unset: LEGACY_UNSET });

    await col.updateMany({ kitchenName: { $exists: false } }, { $set: { kitchenName: "" } });
    await col.updateMany({ location: { $exists: false } }, { $set: { location: "" } });
    await col.updateMany({ phone: { $exists: false } }, { $set: { phone: "" } });
    await col.updateMany({ whatsapp: { $exists: false } }, { $set: { whatsapp: "" } });
    await col.updateMany({ vegOnly: { $exists: false } }, { $set: { vegOnly: false } });
    await col.updateMany({ isVerified: { $exists: false } }, { $set: { isVerified: true } });
    await col.updateMany({ isActive: { $exists: false } }, { $set: { isActive: true } });

    await dropLegacyUserIndexes(col);

    const Provider = require("../models/Provider");
    await Provider.syncIndexes();
    console.log("✅ Provider indexes synced with schema");
  } catch (e) {
    console.error("Provider collection repair failed:", e.message);
  }
}

module.exports = { repairProvidersCollection };
