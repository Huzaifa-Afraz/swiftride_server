// src/routes/host.routes.js
import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import { getHostDashboardStats } from "../controllers/hostDashboard.controller.js";

const router = express.Router();

// GET /api/host/dashboard-stats
router.get(
  "/dashboard-stats",
  authenticate,
  authorizeRoles("host", "showroom"), // both host and showroom see their own stats
  getHostDashboardStats
);

export default router;
