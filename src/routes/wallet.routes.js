import express from "express";
import { authenticate, authorizeRoles } from "../middlewares/auth.middleware.js";
import * as walletController from "../controllers/wallet.controller.js";

const router = express.Router();

// Host / Showroom / Admin can see wallet
router.get(
  "/me",
  authenticate,
  authorizeRoles("host", "showroom", "admin"),
  walletController.getMyWallet
);

// Host / Showroom / Admin can see their transactions
router.get(
  "/me/transactions",
  authenticate,
  authorizeRoles("host", "showroom", "admin"),
  walletController.getMyWallet // Updated to consolidate wallet + txs
);

router.post(
  "/withdraw",
  authenticate,
  authorizeRoles("host", "showroom"),
  walletController.requestWithdrawal
);

import { kycUpload } from "../config/multer.js";

// Admin Routes
router.get(
  "/admin/withdrawals",
  authenticate,
  authorizeRoles("admin"),
  walletController.getAllWithdrawalRequests
);

router.patch(
  "/admin/withdrawals/:requestId",
  authenticate,
  authorizeRoles("admin"),
  kycUpload.fields([{ name: "proof", maxCount: 1 }]),
  walletController.updateWithdrawalStatus
);

router.get("/admin/wallet/:userId/pending-earnings",
    authenticate,
    authorizeRoles("admin"),
    walletController.getUserPendingEarnings
);

export default router;
