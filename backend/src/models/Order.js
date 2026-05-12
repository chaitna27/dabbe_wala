const mongoose = require("mongoose");

const ORDER_STATUSES = ["pending", "accepted", "rejected", "delivered"];

const orderSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Provider",
      required: true,
      index: true,
    },
    menu: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
    delivery_address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    order_date: {
      type: Date,
      required: true,
      default() {
        const d = new Date();
        d.setUTCHours(0, 0, 0, 0);
        return d;
      },
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model("Order", orderSchema);
