const mongoose = require("mongoose");
const Subscription = require("../models/Subscription");
const Provider = require("../models/Provider");
const { ensureProviderForUser } = require("../utils/providerForUser");

exports.createSubscription = async (req, res) => {
  const studentId = req.user.id;
  const { plan } = req.body;
  const providerId = req.body.providerId || req.body.provider_id;
  const startDateRaw = req.body.startDate ?? req.body.start_date;
  const endDateRaw = req.body.endDate ?? req.body.end_date;

  if (!providerId || !mongoose.isValidObjectId(providerId)) {
    return res.status(400).json({ message: "providerId is required" });
  }
  if (!plan || !startDateRaw || !endDateRaw) {
    return res.status(400).json({ message: "plan, startDate, and endDate are required" });
  }

  try {
    const exists = await Provider.exists({ _id: providerId });
    if (!exists) {
      return res.status(404).json({ message: "Provider not found" });
    }

    await Subscription.create({
      student: studentId,
      provider: providerId,
      plan: String(plan).trim(),
      start_date: new Date(startDateRaw),
      end_date: new Date(endDateRaw),
      status: "pending",
    });

    return res.status(201).json({ message: "Subscription created" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getStudentSubscriptions = async (req, res) => {
  const studentId = req.user.id;

  try {
    const rows = await Subscription.find({ student: studentId })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = rows.map((s) => ({
      id: s._id.toString(),
      student_id: s.student.toString(),
      provider_id: s.provider.toString(),
      plan: s.plan,
      start_date: s.start_date,
      end_date: s.end_date,
      status: s.status,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));

    return res.json(shaped);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderSubscriptions = async (req, res) => {
  const providerUserId = req.user.id;

  try {
    const provider = await ensureProviderForUser(providerUserId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const rows = await Subscription.find({ provider: provider._id })
      .populate("student", "name")
      .sort({ createdAt: -1 })
      .lean();

    const shaped = rows.map((s) => ({
      id: s._id.toString(),
      student_id: s.student._id.toString(),
      provider_id: s.provider.toString(),
      student_name: s.student.name,
      plan: s.plan,
      start_date: s.start_date,
      end_date: s.end_date,
      status: s.status,
      created_at: s.createdAt,
      updated_at: s.updatedAt,
    }));

    return res.json(shaped);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateSubscriptionStatus = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  let { status } = req.body;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid subscription id" });
  }

  if (status === "approved" || status === "accepted") {
    status = "active";
  }

  if (!["pending", "active", "rejected", "cancelled"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const sub = await Subscription.findOneAndUpdate(
      { _id: id, provider: provider._id },
      { status },
      { new: true }
    );

    if (!sub) {
      return res.status(403).json({ message: "Not authorized" });
    }

    return res.json({ message: "Status updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
