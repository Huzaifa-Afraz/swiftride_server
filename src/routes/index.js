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
router.use("/reviews", reviewRoutes);
// router.use("/chat", chatRoutes); // Removed
router.use("/users", userRoutes); // /api/users
router.use("/handover", handoverRoutes); // /api/handover
router.use("/analytics", analyticsRoutes); // /api/analytics
export default router;
