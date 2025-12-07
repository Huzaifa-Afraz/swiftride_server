import { Wallet } from "../models/wallet.model.js";
import { WalletTransaction } from "../models/walletTransaction.model.js";
import { Booking } from "../models/booking.model.js";

const COMMISSION_PERCENT = Number(
  process.env.WALLET_PLATFORM_COMMISSION_PERCENT || 10
);

const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });
  if (!wallet) {
    wallet = await Wallet.create({ user: userId });
  }
  return wallet;
};

/**
 * Called when PAYMENT SUCCESS (Easypaisa success) – money is received by SwiftRide.
 * We calculate:
 *  - platformCommissionAmount
 *  - ownerEarningAmount
 * And put owner's earnings into PENDING balance.
 */
export const createBookingEarning = async (booking) => {
  const commissionAmount = (booking.totalPrice * COMMISSION_PERCENT) / 100;
  const ownerEarning = booking.totalPrice - commissionAmount;

  booking.platformCommissionPercent = COMMISSION_PERCENT;
  booking.platformCommissionAmount = commissionAmount;
  booking.ownerEarningAmount = ownerEarning;
  await booking.save();

  const wallet = await getOrCreateWallet(booking.owner);

  wallet.balancePending += ownerEarning;
  await wallet.save();

  await WalletTransaction.create({
    user: booking.owner,
    booking: booking._id,
    type: "earning",
    status: "pending",
    amount: ownerEarning,
    description: `Booking earning (pending) for booking ${booking._id}`,
    balanceAfterAvailable: wallet.balanceAvailable,
    balanceAfterPending: wallet.balancePending
  });

  return { wallet, booking };
};

/**
 * Called when BOOKING COMPLETED – earnings move from pending to available.
 */
export const releaseBookingEarning = async (bookingId) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return;

  const earning = booking.ownerEarningAmount || 0;
  if (earning <= 0) return;

  const wallet = await getOrCreateWallet(booking.owner);

  // Find transaction(s) for this booking
  const tx = await WalletTransaction.findOne({
    user: booking.owner,
    booking: bookingId,
    type: "earning",
    status: "pending"
  });

  if (!tx) return;

  wallet.balancePending -= earning;
  wallet.balanceAvailable += earning;
  await wallet.save();

  tx.status = "available";
  tx.balanceAfterAvailable = wallet.balanceAvailable;
  tx.balanceAfterPending = wallet.balancePending;
  await tx.save();

  return { wallet, booking, transaction: tx };
};

export const getWalletForUser = async (userId) => {
  const wallet = await getOrCreateWallet(userId);
  return wallet;
};

export const getTransactionsForUser = async (userId, limit = 50) => {
  const txs = await WalletTransaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("booking", "invoiceNumber status totalPrice");

  return txs;
};
