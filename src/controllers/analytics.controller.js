import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { Booking } from "../models/booking.model.js";
import { Car } from "../models/car.model.js";
import { Wallet } from "../models/wallet.model.js";
import { WalletTransaction } from "../models/walletTransaction.model.js";
import mongoose from "mongoose";

export const getDashboardAnalytics = catchAsync(async (req, res) => {
  const hostId = new mongoose.Types.ObjectId(req.user.id);

  // 1. Basic Stats
  const totalBookings = await Booking.countDocuments({ owner: hostId });
  const completedBookings = await Booking.countDocuments({
    owner: hostId,
    status: "completed",
  });
  const activeBookings = await Booking.countDocuments({
    owner: hostId,
    status: "ongoing",
  });
  const cancelledBookings = await Booking.countDocuments({
    owner: hostId,
    status: "cancelled",
  });
  const totalCars = await Car.countDocuments({ owner: hostId });

  // 2. Financials
  // Fetch current wallet state (Single Source of Truth for *current* funds)
  const wallet = await Wallet.findOne({ user: hostId });
  const pendingEarnings = wallet ? wallet.balancePending : 0;
  const availableBalance = wallet ? wallet.balanceAvailable : 0;

  // Calculate Lifetime Earnings from Transactions
  const lifetimeEarningsAgg = await WalletTransaction.aggregate([
    { 
      $match: { 
        user: hostId, 
        type: "earning" 
      } 
    },
    { 
      $group: { 
        _id: null, 
        total: { $sum: "$amount" } 
      } 
    }
  ]);
  const totalEarningsFromTxs = lifetimeEarningsAgg[0]?.total || 0;

  // HEURISTIC: If transaction history is missing (e.g. usage of legacy data), 
  // assume Total Earnings is at least the current available balance + pending.
  const totalEarnings = Math.max(totalEarningsFromTxs, availableBalance + pendingEarnings);

  // 3. Monthly Revenue Chart (Last 6 Months - Dynamic Filling)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months to include current month = 6 total
  sixMonthsAgo.setDate(1); // Start of that month

  const monthlyRevenue = await WalletTransaction.aggregate([
    {
      $match: {
        user: hostId,
        type: "earning",
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
        },
        revenue: { $sum: "$amount" },
      },
    },
  ]);

  // Generate labels for the last 6 months and fill data
  const chartData = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  for (let i = 0; i < 6; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthIndex = d.getMonth(); // 0-11
    const year = d.getFullYear();
    const label = monthNames[monthIndex];

    // Find matching data
    const found = monthlyRevenue.find(
      (item) => item._id.month === monthIndex + 1 && item._id.year === year
    );

    chartData.push({
      label,
      value: found ? found.revenue : 0, // Fill 0 if no data
    });
  }

  sendSuccessResponse(res, httpStatus.OK, "Analytics fetched", {
    stats: {
      totalBookings,
      completedBookings,
      activeBookings,
      cancelledBookings,
      totalEarnings,     // Robust
      pendingEarnings,   // Real
      availableBalance,  // Real
      totalCars,
    },
    chartData,
  });
});
