import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { addReview, getCarReviews } from "../controllers/review.controller.js";

const router = express.Router();

// Public: Get reviews (anyone can see reviews)
router.get("/car/:carId", getCarReviews);

// Protected: Add review (only authenticated users who booked)
router.post("/add", authenticate, addReview);

export default router;
