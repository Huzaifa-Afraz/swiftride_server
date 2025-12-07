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
  walletController.getMyTransactions
);

export default router;
