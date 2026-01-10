import { Review } from "../models/review.model.js";
import { Booking } from "../models/booking.model.js";
import { Car } from "../models/car.model.js";
import mongoose from "mongoose";

// Add a review
export const addReview = async (req, res, next) => {
  try {
    const { bookingId, rating, comment } = req.body;
    const reviewerId = req.user._id;
    console.log("Booking ID:", bookingId);
    console.log("Reviewer ID:", reviewerId);
    console.log("Rating:", rating);
    console.log("Comment:", comment);

    // 1. Verify Booking exists and belongs to user
    const booking = await Booking.findOne({
      _id: bookingId,
      customer: reviewerId,
      status: "completed" // Can only review completed bookings
    });

    if (!booking) {
      return res.status(400).json({
        message: "Invalid booking or booking not completed yet."
      });
    }

    // 2. Check if already reviewed
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ message: "You have already reviewed this booking." });
    }

    // 3. Create Review
    const review = await Review.create({
      booking: bookingId,
      car: booking.car,
      reviewer: reviewerId,
      rating,
      comment
    });

    // Optional: Update Car's average rating here or use aggregation on read
    
    res.status(201).json({
      message: "Review submitted successfully",
      review
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a specific car
export const getCarReviews = async (req, res, next) => {
  try {
    const { carId } = req.params;

    const reviews = await Review.find({ car: carId })
      .populate("reviewer", "fullName email") // Show reviewer info
      .sort({ createdAt: -1 }); // Newest first

    // Calculate Average
    const stats = await Review.aggregate([
      { $match: { car: new mongoose.Types.ObjectId(carId) } },
      {
        $group: {
          _id: "$car",
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const averageRating = stats.length > 0 ? stats[0].averageRating.toFixed(1) : 0;
    const totalReviews = stats.length > 0 ? stats[0].totalReviews : 0;

    res.json({
      reviews,
      averageRating,
      totalReviews
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews by the current user
export const getUserReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ reviewer: req.user._id })
      .populate("car", "make model year primaryPhoto") // Show car info
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};
