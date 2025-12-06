import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    owner: {
      // host or showroom who owns the car (denormalized for easier queries)
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    totalPrice: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
