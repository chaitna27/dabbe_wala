const mongoose = require("mongoose");

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snacks"];

const menuSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    items: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    day: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: {
        values: DAYS,
        message: "Invalid day",
      },
    },
    meal_type: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      enum: {
        values: MEAL_TYPES,
        message: "Invalid meal type",
      },
    },
    is_veg: {
      type: Boolean,
      default: true,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    image: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

menuSchema.set("toJSON", { virtuals: true, versionKey: false });
menuSchema.virtual("id").get(function idGetter() {
  return this._id.toHexString();
});

module.exports = mongoose.model("Menu", menuSchema);
