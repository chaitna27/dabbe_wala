const Provider = require("../models/Provider");
const Order = require("../models/Order");
const Review = require("../models/Review");

exports.getPublicProviders = async (req, res) => {
  try {
    const providers = await Provider.find({ isActive: true }).lean();

    const results = await Promise.all(
      providers.map(async (p) => {
        const orderIds = await Order.find({ provider: p._id }).distinct("_id");
        let rating = 0;
        if (orderIds.length > 0) {
          const agg = await Review.aggregate([
            { $match: { order: { $in: orderIds } } },
            { $group: { _id: null, avg: { $avg: "$rating" } } },
          ]);
          if (agg[0]?.avg != null) {
            rating = Math.round(agg[0].avg * 10) / 10;
          }
        }

        return {
          id: p._id.toString(),
          userId: p.userId?.toString?.() ?? String(p.userId),
          kitchenName: p.kitchenName || "",
          location: p.location || "",
          phone: p.phone || "",
          whatsapp: p.whatsapp || "",
          vegOnly: Boolean(p.vegOnly),
          isVerified: Boolean(p.isVerified),
          isActive: Boolean(p.isActive),
          rating,
        };
      }),
    );

    return res.json(results);
  } catch (err) {
    console.error("getPublicProviders:", err);
    return res.status(500).json({
      message: "Failed to fetch providers",
    });
  }
};

exports.getProviderDashboard = async (req, res) => {
  const userId = req.user.id;

  try {
    const provider = await Provider.findOne({ userId });
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
    return res.status(500).json({ message: err.message });
  }
};

exports.deactivateProvider = async (req, res) => {
  const userId = req.user.id;

  try {
    await Provider.findOneAndUpdate(
      { userId },
      { isActive: false },
      { new: true },
    );

    return res.json({ message: "Account deactivated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.reactivateProvider = async (req, res) => {
  const userId = req.user.id;

  try {
    await Provider.findOneAndUpdate({ userId }, { isActive: true });

    return res.json({ message: "Account reactivated successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderProfile = async (req, res) => {
  const userId = req.user.id;

  try {
    const provider = await Provider.findOne({ userId }).select("isActive");
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    return res.json({ isActive: provider.isActive });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
