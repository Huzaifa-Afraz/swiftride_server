import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import * as adminController from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticate, authorizeRoles("admin"));

router.get("/kyc", adminController.getAllKyc);
router.patch("/kyc/:kycId/approve", adminController.approveKyc);
router.patch("/kyc/:kycId/reject", adminController.rejectKyc);
router.get("/bookings", adminController.getAllBookings);
router.get("/bookings/:bookingId", adminController.getBookingDetail);
export default router;
