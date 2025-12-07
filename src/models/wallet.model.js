import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      required: true
    },
    currency: {
      type: String,
      default: process.env.INVOICE_CURRENCY || "PKR"
    },
    balanceAvailable: {
      type: Number,
      default: 0 // Withdrawable / usable
    },
    balancePending: {
      type: Number,
      default: 0 // Bookings paid but not completed
    }
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
