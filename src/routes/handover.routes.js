import express from "express";
import * as handoverController from "../controllers/handover.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { carUpload } from "../config/multer.js"; // Reuse existing upload config (or create new one)

const router = express.Router();

router.post("/scan", authenticate, handoverController.scanHandoverQR);

// Allow up to 8 images
router.post(
  "/pickup",
  authenticate,
  carUpload.array("images", 8), 
  handoverController.processPickup
);

router.post(
  "/return",
  authenticate,
  carUpload.array("images", 8),
  handoverController.processReturn
);

export default router;
