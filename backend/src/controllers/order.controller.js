const mongoose = require("mongoose");
const Order = require("../models/Order");
const Menu = require("../models/Menu");
const User = require("../models/User");
const { ensureProviderForUser } = require("../utils/providerForUser");
const Review = require("../models/Review");

exports.createOrder = async (req, res) => {
  const studentId = req.user.id;
  const menu_id = req.body.menuId || req.body.menu_id;
  const delivery_address = req.body.deliveryAddress ?? req.body.delivery_address;

  if (!menu_id || !mongoose.isValidObjectId(menu_id)) {
    return res.status(400).json({ message: "menuId is required" });
  }

  try {
    const menu = await Menu.findById(menu_id).lean();
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    const student = await User.findById(studentId).select("address");
    if (!student) {
      return res.status(401).json({ message: "User not found" });
    }

    const userAddress = student.address?.trim();
    const finalAddress = (delivery_address && String(delivery_address).trim()) || userAddress;

    if (!finalAddress) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);

    const order = await Order.create({
      student: studentId,
      provider: menu.provider,
      menu: menu._id,
      delivery_address: finalAddress,
      order_date: d,
      status: "pending",
    });

    return res.status(201).json({
      message: "Order placed",
      order_id: order._id.toString(),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStudentOrders = async (req, res) => {
  const studentId = req.user.id;

  try {
    const orders = await Order.find({ student: studentId })
      .sort({ createdAt: -1 })
      .populate("menu", "items price")
      .populate({
        path: "provider",
        select: "user",
        populate: { path: "user", select: "name", model: "User" },
      })
      .lean();

    const ids = orders.map((o) => o._id);
    const existingReviews = await Review.find({
      student: studentId,
      order: { $in: ids },
    })
      .select("order")
      .lean();
    const reviewedSet = new Set(existingReviews.map((r) => r.order.toString()));

    const rows = orders.map((o) => ({
      order_id: o._id.toString(),
      status: o.status,
      order_date: o.order_date,
      items: o.menu?.items,
      price: o.menu?.price,
      provider_name: o.provider?.user?.name,
      reviewed: reviewedSet.has(o._id.toString()),
    }));

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderOrders = async (req, res) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Not a provider" });
  }

  const userId = req.user.id;

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const orders = await Order.find({ provider: provider._id })
      .sort({ createdAt: -1 })
      .populate("student", "name")
      .populate("menu", "items price")
      .lean();

    const rows = orders.map((o) => ({
      order_id: o._id.toString(),
      status: o.status,
      order_date: o.order_date,
      delivery_address: o.delivery_address,
      student_name: o.student?.name,
      items: o.menu?.items,
      price: o.menu?.price,
    }));

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;
  const { status } = req.body;

  const allowed = ["accepted", "rejected", "delivered"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, provider: provider._id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(403).json({ message: "Not authorized" });
    }

    return res.json({ message: "Status updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderSummary = async (req, res) => {
  if (req.user.role !== "provider") {
    return res.status(403).json({ message: "Not a provider" });
  }

  const userId = req.user.id;

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const pid = provider._id;
    const [total_orders, pending_orders, accepted_orders, delivered_orders] =
      await Promise.all([
        Order.countDocuments({ provider: pid }),
        Order.countDocuments({ provider: pid, status: "pending" }),
        Order.countDocuments({ provider: pid, status: "accepted" }),
        Order.countDocuments({ provider: pid, status: "delivered" }),
      ]);

    return res.json({
      total_orders,
      pending_orders,
      accepted_orders,
      delivered_orders,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  const studentId = req.user.id;
  const { orderId } = req.params;

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ message: "Invalid order id" });
  }

  try {
    const result = await Order.deleteOne({
      _id: orderId,
      student: studentId,
      status: "pending",
    });

    if (result.deletedCount === 0) {
      return res.status(403).json({ message: "Cannot cancel order" });
    }

    return res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
