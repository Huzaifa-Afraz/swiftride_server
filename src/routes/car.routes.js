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
  carController.createCar
);

  // validate(createCarSchema),

// Get current owner's cars
router.get(
  "/me",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.deleteCar
);




// public routes for getting car details could be added here
router.get("/:carId", carController.getCarById);
export default router;
