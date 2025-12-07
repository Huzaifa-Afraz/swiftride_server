// src/controllers/hostDashboard.controller.js
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import * as hostDashboardService from "../services/hostDashboard.service.js";

export const getHostDashboardStats = catchAsync(async (req, res) => {
  const userId = req.user.id; // from authenticate middleware

  const data = await hostDashboardService.getHostDashboardStats(userId);

  // Match requested response shape exactly
  return res.status(httpStatus.OK).json({
    success: true,
    data
  });
});
