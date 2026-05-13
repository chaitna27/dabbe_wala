const mongoose = require("mongoose");
const Order = require("../models/Order");
const Review = require("../models/Review");
const { ensureProviderForUser } = require("../utils/providerForUser");

exports.addReview = async (req, res) => {
  const studentId = req.user.id;
  const { orderId, order_id, rating, comment } = req.body;
  const orderRef = orderId || order_id;

  if (!orderRef || !mongoose.isValidObjectId(orderRef)) {
    return res.status(400).json({ message: "orderId is required" });
  }

  if (rating === undefined || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  if (!comment || String(comment).trim().length < 5) {
    return res.status(400).json({
      message: "Review must be at least 5 characters long",
    });
  }

  try {
    const order = await Order.findOne({
      _id: orderRef,
      student: studentId,
      status: "delivered",
    });

    if (!order) {
      return res.status(403).json({
        message: "You can review only your delivered orders",
      });
    }

    const existing = await Review.findOne({
      order: orderRef,
      student: studentId,
    });

    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this order" });
    }

    await Review.create({
      order: orderRef,
      student: studentId,
      rating: Number(rating),
      comment: String(comment).trim(),
    });

    return res.json({ message: "Review added successfully" });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "You have already reviewed this order" });
    }
    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderReviews = async (req, res) => {
  const userId = req.user.id;

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const orderIds = await Order.find({ provider: provider._id }).distinct("_id");

    const reviews = await Review.find({ order: { $in: orderIds } })
      .populate("student", "name")
      .populate({
        path: "order",
        select: "menu",
        populate: { path: "menu", select: "items" },
      })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = reviews.map((r) => ({
      id: r._id.toString(),
      rating: r.rating,
      comment: r.comment,
      created_at: r.createdAt,
      student_name: r.student?.name,
      menu_items: r.order?.menu?.items ?? "Menu removed",
    }));

    return res.json(shaped);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
