import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import * as walletService from "../services/wallet.service.js";

// export const getMyWallet = catchAsync(async (req, res) => {
//   const wallet = await walletService.getWalletForUser(req.user.id);

//   sendSuccessResponse(res, httpStatus.OK, "Wallet fetched", {
//     wallet
//   });
// });
export const getMyWallet = catchAsync(async (req, res) => {
  const wallet = await walletService.getWalletForUser(req.user.id);

  const data = {
    userId: wallet.user,
    currency: wallet.currency,
    balanceAvailable: wallet.balanceAvailable,
    balancePending: wallet.balancePending,
    updatedAt: wallet.updatedAt
  };

  sendSuccessResponse(res, httpStatus.OK, "Wallet fetched", data);
});


// export const getMyTransactions = catchAsync(async (req, res) => {
//   const limit = Number(req.query.limit) || 50;
//   const txs = await walletService.getTransactionsForUser(req.user.id, limit);

//   sendSuccessResponse(res, httpStatus.OK, "Wallet transactions fetched", {
//     transactions: txs
//   });
// });

export const getMyTransactions = catchAsync(async (req, res) => {
  const limit = Number(req.query.limit) || 50;
  const txs = await walletService.getTransactionsForUser(req.user.id, limit);

  const items = txs.map((t) => ({
    id: t._id,
    type: t.type, // earning | payout | adjustment
    status: t.status, // pending | available | paid_out
    amount: t.amount,
    currency: t.currency,
    booking: t.booking
      ? {
          id: t.booking._id,
          invoiceNumber: t.booking.invoiceNumber,
          status: t.booking.status,
          totalPrice: t.booking.totalPrice
        }
      : null,
    description: t.description,
    balanceAfterAvailable: t.balanceAfterAvailable,
    balanceAfterPending: t.balanceAfterPending,
    createdAt: t.createdAt
  }));

  sendSuccessResponse(res, httpStatus.OK, "Wallet transactions fetched", {
    items
  });
});

