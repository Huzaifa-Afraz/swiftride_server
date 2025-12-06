import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = express.Router();

router.post(
  "/booking/:bookingId/init",
  authenticate,
  authorizeRoles("customer"),
  paymentController.initBookingPayment
);

router.post("/easypaisa/callback", paymentController.easypaisaCallback);
router.get("/easypaisa/callback", paymentController.easypaisaCallback);

export default router;
