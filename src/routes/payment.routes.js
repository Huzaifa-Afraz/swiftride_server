import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import * as paymentController from "../controllers/payment.controller.js";

const router = express.Router();

// 1. Initialize Payment
router.post(
  "/booking/:bookingId/init",
  authenticate,
  authorizeRoles("customer"),
  paymentController.initBookingPayment
);

// 2. Callback / IPN
// Easypaisa uses GET for redirects and sometimes GET/POST for IPN depending on config.
// It's safest to allow both.
router.post("/easypaisa/callback", paymentController.easypaisaCallback);
router.get("/easypaisa/callback", paymentController.easypaisaCallback);

export default router;