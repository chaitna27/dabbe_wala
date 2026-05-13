const mongoose = require("mongoose");
const Menu = require("../models/Menu");
const Provider = require("../models/Provider");
const { ensureProviderForUser } = require("../utils/providerForUser");

const normalize = (v) => (typeof v === "string" ? v.trim().toLowerCase() : v);

/** Parses booleans from JSON or multipart form strings ("0" / "1"). */
function parseBoolFlag(v) {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).trim().toLowerCase();
  if (s === "true" || s === "1" || s === "yes" || s === "on") return true;
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return undefined;
}

const menuPublicShape = (m) => ({
  id: m._id.toString(),
  providerId: (m.provider?._id || m.provider).toString(),
  items: m.items ?? "",
  price: m.price ?? 0,
  day: m.day,
  mealType: m.meal_type,
  isVeg: Boolean(m.is_veg),
  isAvailable: Boolean(m.is_available),
  image: m.image || null,
  kitchenName: m.provider?.kitchenName ?? "",
  location: m.provider?.location ?? "",
  createdAt: m.createdAt,
  updatedAt: m.updatedAt,
});

exports.getMenus = async (req, res) => {
  try {
    const menus = await Menu.find({ is_available: true })
      .populate("provider", "kitchenName location")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(menus.map(menuPublicShape));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.createMenu = async (req, res) => {
  console.log("req.user:", req.user);
  const userId = req.user.id;
  const { items, price, day, meal_type, mealType, is_veg, isVeg } = req.body;
  const image = req.file?.path || null;

  const mealTypeRaw = meal_type ?? mealType;

  if (!items || price === undefined || !day || !mealTypeRaw) {
    return res.status(400).json({ message: "All fields required" });
  }

  const priceNum = Number(price);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    return res.status(400).json({ message: "Invalid price" });
  }

  const vegFlag = is_veg !== undefined ? is_veg : isVeg;
  const vegParsed = parseBoolFlag(vegFlag);
  const isVegBool = vegParsed === undefined ? true : vegParsed;

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const menu = await Menu.create({
      provider: provider._id,
      items: String(items).trim(),
      price: priceNum,
      day: normalize(day),
      meal_type: normalize(mealTypeRaw),
      is_veg: isVegBool,
      is_available: true,
      image,
    });

    return res.status(201).json({
      message: "Menu added successfully",
      id: menu._id.toString(),
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    return res.status(500).json({ message: err.message });
  }
};

exports.getProviderMenus = async (req, res) => {
  console.log("req.user:", req.user);
  const userId = req.user.id;

  try {
    const provider = await ensureProviderForUser(userId);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const menus = await Menu.find({ provider: provider._id })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = menus.map((m) => ({
      id: m._id.toString(),
      providerId: m.provider.toString(),
      items: m.items,
      price: m.price,
      day: m.day,
      mealType: m.meal_type,
      isVeg: Boolean(m.is_veg),
      isAvailable: Boolean(m.is_available),
      image: m.image,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return res.json(shaped);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.updateMenu = async (req, res) => {
  const { id } = req.params;
  const { items, price, is_available, isAvailable, is_veg, isVeg } = req.body;
  const image = req.file?.path || null;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid menu id" });
  }

  const availRaw = is_available !== undefined ? is_available : isAvailable;
  const avail = parseBoolFlag(availRaw);
  const vegRaw = is_veg !== undefined ? is_veg : isVeg;
  const veg = parseBoolFlag(vegRaw);

  try {
    const provider = await ensureProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const menu = await Menu.findOne({ _id: id, provider: provider._id });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found" });
    }

    if (items !== undefined) menu.items = String(items).trim();
    if (price !== undefined) {
      const p = Number(price);
      if (!Number.isFinite(p) || p < 0) {
        return res.status(400).json({ message: "Invalid price" });
      }
      menu.price = p;
    }
    if (avail !== undefined) menu.is_available = avail;
    if (veg !== undefined) menu.is_veg = veg;
    if (image) menu.image = image;

    await menu.save();

    return res.json({ message: "Menu updated" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.deleteMenu = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid menu id" });
  }

  try {
    const provider = await ensureProviderForUser(req.user.id);
    if (!provider) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const result = await Menu.deleteOne({ _id: id, provider: provider._id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: "Menu not found" });
    }

    return res.json({ message: "Menu deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMenusByProviderId = async (req, res) => {
  const { providerId } = req.params;

  if (!mongoose.isValidObjectId(providerId)) {
    return res.status(400).json({ message: "Invalid provider id" });
  }

  try {
    const exists = await Provider.exists({ _id: providerId });
    if (!exists) {
      return res.status(404).json({ message: "Provider not found" });
    }

    const menus = await Menu.find({
      provider: providerId,
      is_available: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = menus.map((m) => ({
      id: m._id.toString(),
      providerId: m.provider.toString(),
      items: m.items,
      price: m.price,
      day: m.day,
      mealType: m.meal_type,
      isVeg: Boolean(m.is_veg),
      isAvailable: Boolean(m.is_available),
      image: m.image,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    return res.json(shaped);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
