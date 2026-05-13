const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    kitchenName: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },

    whatsapp: {
      type: String,
      trim: true,
      maxlength: 20,
      default: "",
    },

    vegOnly: {
      type: Boolean,
      default: false,
    },

    isVerified: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

providerSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model("Provider", providerSchema);
