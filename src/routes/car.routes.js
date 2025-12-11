import express from "express";
import {
  authenticate,
  authorizeRoles,
} from "../middlewares/auth.middleware.js";
import { requireApprovedKyc } from "../middlewares/kyc.middleware.js";
import { carUpload } from "../config/multer.js";
import * as carController from "../controllers/car.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  createCarSchema,
  searchCarsSchema,
} from "../validations/car.validation.js";

const router = express.Router();

router.get("/", validate(searchCarsSchema, "query"), carController.searchCars);

router.get(
  "/me",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.getMyCars
);

router.get("/:id", carController.getCarById);

router.post(
  "/",
  authenticate,
  authorizeRoles("host", "showroom"),
  requireApprovedKyc,
  carUpload.fields([{ name: "photos", maxCount: 10 }]),
  validate(createCarSchema),
  carController.createCar
);

router.patch(
  "/:id",
  authenticate,
  authorizeRoles("host", "showroom"),
  // Add validation middleware here if you have updateCarSchema
  carController.updateCar
);

// ✅ NEW: Delete Route
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.deleteCar
);

export default router;
