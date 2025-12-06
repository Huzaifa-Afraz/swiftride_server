import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireApprovedKyc } from "../middlewares/kyc.middleware.js";
import { carUpload } from "../config/multer.js";
import * as carController from "../controllers/car.controller.js";

const router = express.Router();

// Create a car listing
router.post(
  "/",
  authenticate,
  authorizeRoles("host", "showroom"),
  requireApprovedKyc,
  carUpload.array("images", 10), // "images" is form-data field, up to 10 files
  carController.createCar
);

// Get current user's cars
router.get(
  "/me",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.getMyCars
);

export default router;
