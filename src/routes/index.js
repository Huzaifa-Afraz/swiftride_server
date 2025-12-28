import express from "express";
import authRoutes from "./auth.routes.js";
import kycRoutes from "./kyc.routes.js";
import adminRoutes from "./admin.routes.js";
import carRoutes from "./car.routes.js";
import bookingRoutes from "./booking.routes.js";
import paymentRoutes from "./payment.routes.js";
import walletRoutes from "./wallet.routes.js";
import hostRoutes from "./host.routes.js";
import reviewRoutes from "./review.routes.js";
import chatRoutes from "./chat.routes.js";
import userRoutes from "./user.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/kyc", kycRoutes);
router.use("/admin", adminRoutes);
router.use("/cars", carRoutes);
router.use("/bookings", bookingRoutes);
router.use("/payments", paymentRoutes);
router.use("/wallet", walletRoutes);
router.use("/host", hostRoutes);
router.use("/reviews", reviewRoutes);
router.use("/chat", chatRoutes);
router.use("/users", userRoutes); // /api/users
export default router;
