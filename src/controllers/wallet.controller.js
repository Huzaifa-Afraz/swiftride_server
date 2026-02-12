import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import httpStatus from "http-status";
import * as walletService from "../services/wallet.service.js";

// User: Request Withdrawal
export const requestWithdrawal = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { amount, bankDetails } = req.body;

  const request = await walletService.requestWithdrawal(userId, amount, bankDetails);

  sendSuccessResponse(res, httpStatus.CREATED, "Withdrawal requested successfully", {
    request
  });
});

// User: Get My Wallet (Balance + Txs)
export const getMyWallet = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const wallet = await walletService.getWalletForUser(userId);
  const transactions = await walletService.getTransactionsForUser(userId);
  // Include all withdrawal requests (history)
  const withdrawalRequests = await walletService.getWithdrawalRequests({ user: userId });

  sendSuccessResponse(res, httpStatus.OK, "Wallet fetched", {
    wallet,
    transactions,
    withdrawalRequests
  });
});

// Admin: Get All Requests
export const getAllWithdrawalRequests = catchAsync(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  
  const requests = await walletService.getWithdrawalRequests(filter);

  sendSuccessResponse(res, httpStatus.OK, "Withdrawal requests fetched", {
    requests
  });
});

// Admin: Update Status (Approve/Reject)
export const updateWithdrawalStatus = catchAsync(async (req, res) => {
  const { requestId } = req.params;
  const { status, adminNote } = req.body; // status = 'approved' or 'rejected'
  const proofFile = req.files?.proof ? req.files.proof[0] : null;

  let request;
  if (status === "approved") {
    request = await walletService.approveWithdrawal(requestId, adminNote, proofFile);
  } else if (status === "rejected") {
    request = await walletService.rejectWithdrawal(requestId, adminNote);
  } else {
    return res.status(400).json({ message: "Invalid status" });
  }

  sendSuccessResponse(res, httpStatus.OK, `Withdrawal request ${status}`, {
    request
  });
});

// Admin: Get Pending Earnings Detail
export const getUserPendingEarnings = catchAsync(async (req, res) => {
    const { userId } = req.params;
    const transactions = await walletService.getUserPendingEarnings(userId);
  
    sendSuccessResponse(res, httpStatus.OK, "Pending earnings fetched", {
      transactions
    });
});
