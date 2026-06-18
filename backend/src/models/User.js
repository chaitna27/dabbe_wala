const mongoose = require("mongoose");

const ROLES = ["student", "provider", "admin"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    password: {
      type: String,
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },

    avatar: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ROLES,
      default: "student",
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    resetToken: { type: String, default: null, select: false },
    resetTokenExpiry: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret.password;
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
