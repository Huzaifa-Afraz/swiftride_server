import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import * as analyticsController from "../controllers/analytics.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("host", "showroom"),
  analyticsController.getDashboardAnalytics
);

export default router;
