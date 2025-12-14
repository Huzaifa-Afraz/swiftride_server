import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import { requireApprovedKyc } from "../middlewares/kyc.middleware.js";
import { carUpload } from "../config/multer.js";
import * as carController from "../controllers/car.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import { searchCarsSchema } from "../validations/car.validation.js";

const router = express.Router();

// 1) List / Search (public)
router.get("/", validate(searchCarsSchema, "query"), carController.searchCars);

// 2) My cars (protected) - MUST be before "/:carId"
router.get(
  "/me",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.getMyCars
);

// 3) Create (protected)
router.post(
  "/",
  authenticate,
  authorizeRoles("host", "showroom"),
  requireApprovedKyc,
  carUpload.fields([{ name: "photos", maxCount: 10 }]),
  carController.createCar
);

// 4) Public detail
router.get("/:carId", carController.getCarById);

// 5) Update (protected)
router.patch(
  "/:carId",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.updateCar
);

// 6) Delete (protected)
router.delete(
  "/:carId",
  authenticate,
  authorizeRoles("host", "showroom"),
  carController.deleteCar
);

export default router;
