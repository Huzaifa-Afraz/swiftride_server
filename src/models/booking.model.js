import mongoose from "mongoose";

const extensionSchema = new mongoose.Schema({
  oldEnd: Date,
  newEnd: Date,
  extraHours: Number,
  extraAmount: Number,
  extendedAt: { type: Date, default: Date.now }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"]
  },
  changedAt: { type: Date, default: Date.now },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  note: String
});

const bookingSchema = new mongoose.Schema(
  {
    car: { type: mongoose.Schema.Types.ObjectId, ref: "Car", required: true },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },

    durationHours: Number,
    totalPrice: Number,
    currency: {
      type: String,
      default: process.env.INVOICE_CURRENCY || "PKR"
    },

    status: {
      type: String,
      enum: ["pending", "confirmed", "ongoing", "completed", "cancelled"],
      default: "pending"
    },
    statusHistory: [statusHistorySchema],

    invoiceNumber: String,
    pdfPath: String,

    isExtended: { type: Boolean, default: false },
    extensions: [extensionSchema],

    paymentStatus: {
      type: String,
      enum: ["unpaid", "processing", "paid", "failed"],
      default: "unpaid"
    },
    paymentReference: String
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
