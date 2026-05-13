const Provider = require("../models/Provider");
const Order = require("../models/Order");
const Review = require("../models/Review");
const Menu = require("../models/Menu");
const { haversineKm, formatDistanceLabel, parseLatLng } = require("../utils/geo");
const {
  ensureProviderForUser,
  providerMatch,
} = require("../utils/providerForUser");

async function ratingForProvider(providerId) {
  const orderIds = await Order.find({ provider: providerId }).distinct("_id");
  if (orderIds.length === 0) return 0;
  const agg = await Review.aggregate([
    { $match: { order: { $in: orderIds } } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  if (agg[0]?.avg == null) return 0;
  return Math.round(agg[0].avg * 10) / 10;
}

exports.getPublicProviders = async (req, res) => {
  try {
    const geo = parseLatLng(req.query.lat, req.query.lng);
    let sort = String(req.query.sort || "").toLowerCase();
    if (!sort) sort = geo ? "nearest" : "rating";

    const vegOnly =
      String(req.query.vegOnly || "").toLowerCase() === "true" ||
      req.query.vegOnly === "1";
    const minRating = Math.max(0, Math.min(5, Number(req.query.minRating) || 0));

    const providers = await Provider.find({ isActive: true }).lean();

    const minPriceMap = {};
    const priceAgg = await Menu.aggregate([
      { $match: { is_available: true } },
      { $group: { _id: "$provider", minMenuPrice: { $min: "$price" } } },
    ]);
    priceAgg.forEach((row) => {
      minPriceMap[row._id.toString()] = row.minMenuPrice;
    });

    const rows = await Promise.all(
      providers.map(async (p) => {
        const rating = await ratingForProvider(p._id);
        const plat = p.latitude;
        const plng = p.longitude;
        let distanceKm = null;
        let distanceLabel = null;
        if (
          geo &&
          plat != null &&
          plng != null &&
          Number.isFinite(plat) &&
          Number.isFinite(plng)
        ) {
          distanceKm = haversineKm(geo.lat, geo.lng, plat, plng);
          distanceLabel = formatDistanceLabel(distanceKm);
        }

        return {
          id: p._id.toString(),
          user: p.user ? p.user.toString() : "",
          kitchenName: p.kitchenName || "",
          location: p.location || "",
          phone: p.phone || "",
          whatsapp: p.whatsapp || "",
          vegOnly: Boolean(p.vegOnly),
          isVerified: Boolean(p.isVerified),
          isActive: Boolean(p.isActive),
          latitude: plat == null ? null : plat,
          longitude: plng == null ? null : plng,
          rating,
          minMenuPrice: minPriceMap[p._id.toString()] ?? null,
          distanceKm,
          distanceLabel,
        };
      }),
    );

    let list = rows.filter((r) => {
      if (vegOnly && !r.vegOnly) return false;
      if (minRating > 0 && (r.rating || 0) < minRating) return false;
      return true;
    });

    let sortKey = sort;
    if (sortKey === "nearest" && !geo) sortKey = "rating";
    else if (
      sortKey === "nearest" &&
      geo &&
      !rows.some((x) => x.distanceKm != null)
    ) {
      sortKey = "rating";
    }

    if (sortKey === "nearest" && geo) {
      list.sort((a, b) => {
        const da = a.distanceKm == null ? 1e9 : a.distanceKm;
        const db = b.distanceKm == null ? 1e9 : b.distanceKm;
        if (da !== db) return da - db;
        return (a.kitchenName || "").localeCompare(b.kitchenName || "");
      });
    } else if (sortKey === "pricelow" || sortKey === "price_low") {
      list.sort((a, b) => {
        const pa = a.minMenuPrice ?? 1e9;
        const pb = b.minMenuPrice ?? 1e9;
        if (pa !== pb) return pa - pb;
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (sortKey === "pricehigh" || sortKey === "price_high") {
      list.sort((a, b) => {
        const pa = a.minMenuPrice ?? -1;
        const pb = b.minMenuPrice ?? -1;
        if (pa !== pb) return pb - pa;
        return (b.rating || 0) - (a.rating || 0);
      });
    } else if (sortKey === "name") {
      list.sort((a, b) =>
        (a.kitchenName || "").localeCompare(b.kitchenName || ""),
      );
    } else {
      list.sort((a, b) => {
        const ra = a.rating || 0;
        const rb = b.rating || 0;
        if (rb !== ra) return rb - ra;
        return (a.kitchenName || "").localeCompare(b.kitchenName || "");
      });
    }

    return res.json(list);
  } catch (err) {
    console.error("getPublicProviders:", err);
    return res.status(500).json({
      message: "Failed to fetch providers",
    });
  }
};

exports.getProviderDashboard = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    const provider = await ensureProviderForUser(req.user.id);
    console.log("Provider found:", provider?._id?.toString(), provider?.kitchenName);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const pid = provider._id;
    const total_orders = await Order.countDocuments({ provider: pid });
    const delivered_orders = await Order.countDocuments({
      provider: pid,
      status: "delivered",
    });

    const orderIds = await Order.find({ provider: pid }).distinct("_id");
    let total_reviews = 0;
    let average_rating = 0;

    if (orderIds.length > 0) {
      const agg = await Review.aggregate([
        { $match: { order: { $in: orderIds } } },
        {
          $group: {
            _id: null,
            total_reviews: { $sum: 1 },
            average_rating: { $avg: "$rating" },
          },
        },
      ]);
      if (agg[0]) {
        total_reviews = agg[0].total_reviews;
        average_rating = agg[0].average_rating ?? 0;
      }
    }

    return res.json({
      total_orders,
      delivered_orders,
      total_reviews,
      average_rating,
    });
  } catch (err) {
    console.error("getProviderDashboard:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.deactivateProvider = async (req, res) => {
  try {
    const q = providerMatch(req.user.id);
    if (!q) {
      return res.status(404).json({ message: "Provider not found" });
    }
    await Provider.findOneAndUpdate(q, { isActive: false }, { new: true });

    return res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    console.error("deactivateProvider:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.reactivateProvider = async (req, res) => {
  try {
    const q = providerMatch(req.user.id);
    if (!q) {
      return res.status(404).json({ message: "Provider not found" });
    }
    await Provider.findOneAndUpdate(q, { isActive: true });

    return res.json({ message: "Account reactivated successfully" });
  } catch (err) {
    console.error("reactivateProvider:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

exports.getProviderProfile = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    const provider = await ensureProviderForUser(req.user.id);
    console.log("Provider found:", provider?._id?.toString(), provider?.kitchenName);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    return res.json({
      isActive: provider.isActive,
      kitchenName: provider.kitchenName || "",
      location: provider.location || "",
      phone: provider.phone || "",
      whatsapp: provider.whatsapp || "",
      latitude: provider.latitude == null ? null : provider.latitude,
      longitude: provider.longitude == null ? null : provider.longitude,
    });
  } catch (err) {
    console.error("getProviderProfile:", err);
    return res.status(500).json({ message: err.message || "Server error" });
  }
};

async function saveProviderProfile(req, res) {
  const {
    kitchenName,
    location,
    phone,
    whatsapp,
    latitude,
    longitude,
  } = req.body;

  try {
    console.log("req.user:", req.user);
    const provider = await ensureProviderForUser(req.user.id);
    console.log("Provider found:", provider?._id?.toString(), provider?.kitchenName);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    if (kitchenName !== undefined) {
      provider.kitchenName = String(kitchenName).trim().slice(0, 200);
    }
    if (location !== undefined) {
      provider.location = String(location).trim().slice(0, 300);
    }
    if (phone !== undefined) {
      provider.phone = String(phone).trim().slice(0, 20);
    }
    if (whatsapp !== undefined) {
      provider.whatsapp = String(whatsapp).trim().slice(0, 20);
    }

    if (latitude !== undefined) {
      if (latitude === "" || latitude === null) {
        provider.latitude = null;
      } else {
        const la = Number(latitude);
        if (!Number.isFinite(la) || la < -90 || la > 90) {
          return res
            .status(400)
            .json({ message: "latitude must be a number between -90 and 90" });
        }
        provider.latitude = la;
      }
    }

    if (longitude !== undefined) {
      if (longitude === "" || longitude === null) {
        provider.longitude = null;
      } else {
        const lo = Number(longitude);
        if (!Number.isFinite(lo) || lo < -180 || lo > 180) {
          return res
            .status(400)
            .json({ message: "longitude must be a number between -180 and 180" });
        }
        provider.longitude = lo;
      }
    }

    await provider.save();

    return res.json({
      message: "Profile updated",
      isActive: provider.isActive,
      kitchenName: provider.kitchenName || "",
      location: provider.location || "",
      phone: provider.phone || "",
      whatsapp: provider.whatsapp || "",
      latitude: provider.latitude == null ? null : provider.latitude,
      longitude: provider.longitude == null ? null : provider.longitude,
    });
  } catch (err) {
    console.error("saveProviderProfile:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message || "Server error" });
  }
}

exports.patchProviderProfile = saveProviderProfile;
exports.putProviderProfile = saveProviderProfile;
