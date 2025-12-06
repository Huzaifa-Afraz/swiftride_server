import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireApprovedKyc } from "../middlewares/kyc.middleware.js";
import { carUpload } from "../config/multer.js";
import * as carController from "../controllers/car.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createCarSchema,
  searchCarsSchema
} from "../validations/car.validation.js";

const router = express.Router();

// Public search / filters
router.get(
  "/",
  validate(searchCarsSchema, "query"),
  carController.searchCars
);

// Create a car listing (host / showroom with approved KYC)
router.post(
  "/",
  authenticate,
  authorizeRoles("host", "showroom"),
  requireApprovedKyc,
  carUpload.array("images", 10), // field name: images
  validate(createCarSchema),
  carController.createCar
);

// Get current owner's cars
router.get(
  "/me",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.getMyCars
);

export default router;
