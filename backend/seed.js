/**
 * Seed MongoDB with sample data for local development.
 *
 * Login (after seed):
 *   provider1@test.com / provider123
 *   student1@test.com / student123
 *
 * Usage: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const connectDB = require("./src/config/db");
const User = require("./src/models/User");
const Provider = require("./src/models/Provider");
const Menu = require("./src/models/Menu");
const Order = require("./src/models/Order");
const Review = require("./src/models/Review");
const Subscription = require("./src/models/Subscription");

async function run() {
  await connectDB();

  await Review.deleteMany({});
  await Order.deleteMany({});
  await Subscription.deleteMany({});
  await Menu.deleteMany({});
  await Provider.deleteMany({});
  await User.deleteMany({});

  const hash = async (pw) => bcrypt.hash(pw, 10);

  const providerUser1 = await User.create({
    name: "Provider One",
    email: "provider1@test.com",
    password: await hash("provider123"),
    role: "provider",
    address: "",
  });

  const providerUser2 = await User.create({
    name: "Provider Two",
    email: "provider2@test.com",
    password: await hash("provider123"),
    role: "provider",
    address: "",
  });

  const studentUser1 = await User.create({
    name: "Student One",
    email: "student1@test.com",
    password: await hash("student123"),
    role: "student",
    address: "Hostel Block A, Room 12",
  });

  const studentUser2 = await User.create({
    name: "Student Two",
    email: "student2@test.com",
    password: await hash("student123"),
    role: "student",
    address: "Hostel Block B, Room 5",
  });

  const prov1 = await Provider.create({
    userId: providerUser1._id,
    kitchenName: "Ghar Ka Dabba",
    location: "Near Campus Gate",
    latitude: 18.5204,
    longitude: 73.8567,
    phone: "9876500001",
    whatsapp: "9876500001",
    vegOnly: false,
    isVerified: true,
    isActive: true,
  });

  const prov2 = await Provider.create({
    userId: providerUser2._id,
    kitchenName: "Tiffin Express",
    location: "Main Road",
    latitude: 18.5314,
    longitude: 73.8446,
    phone: "9876500002",
    whatsapp: "9876500002",
    vegOnly: true,
    isVerified: true,
    isActive: true,
  });

  const menu1 = await Menu.create({
    provider: prov1._id,
    items: "Dal, Rice, Sabzi, Roti",
    price: 80,
    day: "monday",
    meal_type: "lunch",
    is_veg: true,
    is_available: true,
    image: null,
  });

  const menu2 = await Menu.create({
    provider: prov1._id,
    items: "Paneer Curry, Jeera Rice, Salad",
    price: 120,
    day: "tuesday",
    meal_type: "dinner",
    is_veg: true,
    is_available: true,
    image: null,
  });

  const menu3 = await Menu.create({
    provider: prov2._id,
    items: "Veg Thali — seasonal vegetables",
    price: 90,
    day: "monday",
    meal_type: "lunch",
    is_veg: true,
    is_available: true,
    image: null,
  });

  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);

  const orderDelivered = await Order.create({
    student: studentUser1._id,
    provider: prov1._id,
    menu: menu1._id,
    delivery_address: studentUser1.address,
    order_date: day,
    status: "delivered",
  });

  await Order.create({
    student: studentUser1._id,
    provider: prov1._id,
    menu: menu2._id,
    delivery_address: studentUser1.address,
    order_date: day,
    status: "pending",
  });

  await Order.create({
    student: studentUser2._id,
    provider: prov2._id,
    menu: menu3._id,
    delivery_address: studentUser2.address,
    order_date: day,
    status: "accepted",
  });

  await Review.create({
    order: orderDelivered._id,
    student: studentUser1._id,
    rating: 5,
    comment: "Great homely food, will order again!",
  });

  const start = new Date();
  const end = new Date();
  end.setMonth(end.getMonth() + 1);

  await Subscription.create({
    student: studentUser1._id,
    provider: prov1._id,
    plan: "Monthly lunch",
    start_date: start,
    end_date: end,
    status: "pending",
  });

  await Subscription.create({
    student: studentUser2._id,
    provider: prov2._id,
    plan: "Weekly dinner",
    start_date: start,
    end_date: end,
    status: "active",
  });

  console.log("Seed completed.");
  console.log("Logins:");
  console.log("  provider1@test.com / provider123");
  console.log("  student1@test.com / student123");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
