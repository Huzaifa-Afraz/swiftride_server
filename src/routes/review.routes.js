import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { addReview, getCarReviews, getUserReviews } from "../controllers/review.controller.js";

const router = express.Router();

// Public: Get reviews (anyone can see reviews)
router.get("/car/:carId", getCarReviews);

// Protected: Add review (only authenticated users who booked)
router.post("/add", authenticate, addReview);

// Protected: Get my reviews
router.get("/my-reviews", authenticate, getUserReviews);

export default router;
