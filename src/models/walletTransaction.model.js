import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking"
    },
    type: {
      type: String,
      enum: ["earning", "payout", "adjustment"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "available", "paid_out"],
      default: "pending"
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: process.env.INVOICE_CURRENCY || "PKR"
    },
    description: String,
    balanceAfterAvailable: Number,
    balanceAfterPending: Number
  },
  { timestamps: true }
);

export const WalletTransaction = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);
