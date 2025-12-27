import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true // One review per booking
    },
    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      required: true
    },
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 500
    },
    photos: [{ type: String }] // Optional photos of the car/experience
  },
  { timestamps: true }
);

// Prevent duplicate reviews from the same user for the same car (though booking unique constraint handles strict logic)
// reviewSchema.index({ booking: 1 }, { unique: true });

export const Review = mongoose.model("Review", reviewSchema);
