import mongoose from "mongoose";

const withdrawalRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 1
    },
    currency: {
      type: String,
      default: process.env.INVOICE_CURRENCY || "PKR"
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },
    bankDetails: {
      bankName: { type: String, required: true },
      accountTitle: { type: String, required: true },
      accountNumber: { type: String, required: true },
      iban: { type: String }
    },
    adminNote: { type: String },
    proofImage: { type: String },
    proofDate: { type: Date },
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction"
    }
  },
  { timestamps: true }
);

export const WithdrawalRequest = mongoose.model(
  "WithdrawalRequest",
  withdrawalRequestSchema
);
