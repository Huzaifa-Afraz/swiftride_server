import crypto from "crypto";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { Booking } from "../models/booking.model.js";
import * as walletService from "./wallet.service.js";

const provider = process.env.PAYMENT_PROVIDER || "EASYPAISA";

const baseUrl = process.env.EASYPAISA_BASE_URL;        // e.g. https://easypay.easypaisa.com.pk/easypay/
const merchantId = process.env.EASYPAISA_MERCHANT_ID;
const storeId = process.env.EASYPAISA_STORE_ID;
const hashKey = process.env.EASYPAISA_HASH_KEY;
const returnUrl = process.env.EASYPAISA_RETURN_URL;    // front-end URL
const callbackUrl = process.env.EASYPAISA_CALLBACK_URL; // backend URL
const currency = process.env.EASYPAISA_CURRENCY || "PKR";

/**
 * Utility – generate hash/signature according to Easypaisa docs.
 * 
 * IMPORTANT:
 * ----------
 * This is a TEMPLATE. You MUST adjust this function to match the
 * exact algorithm and parameter order that Easypaisa gives you
 * in their merchant integration guide.
 */
const generateEasypaisaHash = (params) => {
  // EXAMPLE approach:
  // 1) Take specific fields in a fixed order (e.g. merchantId, storeId, amount, orderRefNum, returnUrl, callbackUrl)
  // 2) Concatenate with '&' or '~' (whatever Easypaisa requires)
  // 3) Apply HMAC-SHA256 or SHA256 with your hashKey

  // TODO: Replace this logic with EXACT method from Easypaisa docs
  const fieldOrder = [
    "merchantId",
    "storeId",
    "amount",
    "currency",
    "orderRefNum",
    "returnUrl",
    "callbackUrl"
  ];

  const concat = fieldOrder
    .map((key) => params[key])
    .filter((v) => v !== undefined && v !== null)
    .join("&");

  return crypto.createHmac("sha256", hashKey).update(concat).digest("hex");
};

/**
 * INIT PAYMENT – Called by customer to start paying for a booking.
 * Returns:
 *  - paymentPageUrl (Easypaisa URL)
 *  - payload (fields to POST to Easypaisa)
 */
export const initBookingPayment = async (bookingId, customerId) => {
  if (provider !== "EASYPAISA") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Unsupported payment provider configured"
    );
  }

  const booking = await Booking.findById(bookingId).populate("customer");
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.customer._id.toString() !== customerId.toString()) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You can only pay for your own bookings"
    );
  }

  if (booking.paymentStatus === "paid") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Booking already paid");
  }

  const amount = Math.round(booking.totalPrice); // integer PKR
  const orderRefNum = booking.invoiceNumber || booking._id.toString();

  // Build Easypaisa request payload based on their docs
  // TODO: Rename / adjust fields to match Easypaisa exact names
  const params = {
    merchantId,
    storeId,
    amount,
    currency,
    orderRefNum,
    description: `Booking ${booking._id} - ${booking.invoiceNumber}`,
    returnUrl,
    callbackUrl
  };

  const hash = generateEasypaisaHash(params);
  const payload = { ...params, hash };

  booking.paymentStatus = "processing";
  await booking.save();

  return {
    provider: "EASYPAISA",
    paymentPageUrl: baseUrl, // Frontend will POST this payload to this URL
    payload
  };
};

/**
 * CALLBACK – Easypaisa notifies us about payment result.
 * 
 * 'data' will be req.body / req.query depending on their integration style.
 */
export const handleEasypaisaCallback = async (data) => {
  // TODO: Map these according to Easypaisa docs.
  // Typical fields might be:
  // orderRefNum, transactionId, amount, responseCode, hash, currency

  const orderRefNum = data.orderRefNum;
  const transactionId = data.transactionId;
  const responseCode = data.responseCode;
  const receivedHash = data.hash;

  const paramsForHash = {
    merchantId,
    storeId,
    amount: data.amount,
    currency: data.currency,
    orderRefNum,
    returnUrl,
    callbackUrl
  };

  const calculatedHash = generateEasypaisaHash(paramsForHash);

  if (calculatedHash !== receivedHash) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid payment signature from Easypaisa"
    );
  }

  // Find booking using the same reference you sent (invoiceNumber / _id)
  const booking = await Booking.findOne({
    $or: [{ invoiceNumber: orderRefNum }, { _id: orderRefNum }]
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found for payment");
  }

  // TODO: Confirm from docs what responseCode means success
  const isSuccess = responseCode === "0000" || responseCode === "00";

  // if (isSuccess) {
  //   booking.paymentStatus = "paid";
  //   booking.paymentReference = transactionId;
  // } else {
  //   booking.paymentStatus = "failed";
  //   booking.paymentReference = transactionId;
  // }
  if (isSuccess) {
  booking.paymentStatus = "paid";
  booking.paymentReference = transactionId;
  await booking.save();

  // ADD THIS:
  await walletService.createBookingEarning(booking);
} else {
  booking.paymentStatus = "failed";
  booking.paymentReference = transactionId;
  await booking.save();
}

  await booking.save();

  return { booking, isSuccess };
};
