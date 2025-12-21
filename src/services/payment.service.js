import crypto from "crypto";
import httpStatus from "http-status";
import axios from "axios"; // You likely need axios to post the auth_token back to Easypaisa
import ApiError from "../utils/ApiError.js";
import { Booking } from "../models/booking.model.js";
import * as walletService from "./wallet.service.js";

const provider = process.env.PAYMENT_PROVIDER || "EASYPAISA";

// CONFIGURATION
// Live URL: https://easypay.easypaisa.com.pk/easypay/
// Sandbox URL: https://easypaystg.easypaisa.com.pk/easypay/
const baseUrl = process.env.EASYPAISA_BASE_URL; 
const storeId = process.env.EASYPAISA_STORE_ID;
const hashKey = process.env.EASYPAISA_HASH_KEY; // Must be the key from Telenor POC
const returnUrl = process.env.EASYPAISA_RETURN_URL; // Your Frontend URL that receives the auth_token

/**
 * Utility: AES Encryption for Easypaisa (Section 5 of Guide)
 * 1. Sorts parameters alphabetically
 * 2. Creates a query string
 * 3. Encrypts using AES-128-ECB
 */
const generateEasypaisaHash = (params) => {
  // 1. Filter empty/null and exclude the hash field itself
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== "merchantHashedReq" && params[key] !== undefined && params[key] !== "")
    .sort();

  // 2. Create string: key1=val1&key2=val2...
  const dataString = sortedKeys.map((key) => `${key}=${params[key]}`).join("&");

  // 3. Encrypt
  // Easypaisa uses AES-128-ECB. Ensure your hashKey is correct.
  const keyBuffer = Buffer.from(hashKey, "utf-8");
  const cipher = crypto.createCipheriv("aes-128-ecb", keyBuffer, null);
  cipher.setAutoPadding(true); // PKCS5Padding

  let encrypted = cipher.update(dataString, "utf8", "base64");
  encrypted += cipher.final("base64");

  return encrypted;
};

/**
 * INIT PAYMENT
 * Prepares the payload for the frontend to submit to Easypaisa.
 */
// export const initBookingPayment = async (bookingId, customerId) => {
//   if (provider !== "EASYPAISA") {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported payment provider configured");
//   }

//   const booking = await Booking.findById(bookingId).populate("customer");
//   if (!booking) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//   }

//   if (booking.customer._id.toString() !== customerId.toString()) {
//     throw new ApiError(httpStatus.FORBIDDEN, "You can only pay for your own bookings");
//   }

//   if (booking.paymentStatus === "paid") {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Booking already paid");
//   }

//   // Easypaisa requires amount with 1 decimal place (e.g., "10.0") [cite: 472]
//   const amount = parseFloat(booking.totalPrice).toFixed(1);
//   const orderRefNum = booking.invoiceNumber || booking._id.toString();
  
//   // Date format: YYYYMMDD HHMMSS (Optional but good for security)
//   const now = new Date();
//   const expiryDate = now.toISOString().replace(/[-:T]/g, "").slice(0, 14); 

//   // STRICT PARAMETERS based on Guide Section 2.2
//   const params = {
//     storeId: storeId,
//     amount: amount,
//     postBackURL: returnUrl, // Frontend URL
//     orderRefNum: orderRefNum,
//     expiryDate: expiryDate,
//     autoRedirect: "1", // 1 = Redirect back to merchant automatically
//     paymentMethod: "MA_PAYMENT_METHOD", // Starts flow with Mobile Account (optional)
//     // emailAddr: booking.customer.email, // Optional
//     // mobileNum: booking.customer.phoneNumber // Optional
//   };

//   // Generate the hash
//   params.merchantHashedReq = generateEasypaisaHash(params);

//   booking.paymentStatus = "processing";
//   await booking.save();

//   return {
//     provider: "EASYPAISA",
//     paymentPageUrl: `${baseUrl}Index.jsf`, // The URL to POST the form to
//     payload: params,
//   };
// };


// services/payment.service.js

export const initBookingPayment = async (bookingId, customerId) => {
  if (provider !== "EASYPAISA") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Unsupported payment provider configured");
  }

  const booking = await Booking.findById(bookingId).populate("customer");
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  // ... (Your validation checks for customerId and paymentStatus) ...

  const amount = parseFloat(booking.totalPrice).toFixed(1);
  const orderRefNum = booking.invoiceNumber || booking._id.toString();

  // ============================================================
  // START: PASTE THE NEW DATE CODE HERE
  // ============================================================
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');

  // Format: YYYYMMDD HHMMSS (Note the space in the middle)
  const expiryDate = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())} ${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  // ============================================================
  // END: NEW DATE CODE
  // ============================================================

  // STRICT PARAMETERS based on Guide Section 2.2
  const params = {
    storeId: storeId,
    amount: amount,
    postBackURL: returnUrl,
    orderRefNum: orderRefNum,
    expiryDate: expiryDate, // This now uses the correct format with a space
    autoRedirect: "1",
    paymentMethod: "MA_PAYMENT_METHOD", 
  };

  // Generate the hash
  params.merchantHashedReq = generateEasypaisaHash(params);

  booking.paymentStatus = "processing";
  await booking.save();

  return {
    provider: "EASYPAISA",
    paymentPageUrl: `${baseUrl}Index.jsf`,
    payload: params,
  };
};
/**
 * VERIFY PAYMENT (The Handshake)
 * 1. Receives auth_token from frontend.
 * 2. POSTs auth_token back to Easypaisa to confirm status.
 */
export const verifyEasypaisaPayment = async (authToken) => {
  if (!authToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Missing auth_token");
  }

  // The guide requires posting 'auth_token' and 'postBackURL' to Confirm.jsf [cite: 498-500]
  const confirmUrl = `${baseUrl}Confirm.jsf`;
  
  // We must send the EXACT same postBackURL used in init
  const payload = new URLSearchParams();
  payload.append("auth_token", authToken);
  payload.append("postBackURL", returnUrl);

  try {
    // Perform the handshake
    const response = await axios.post(confirmUrl, payload);
    
    // Easypaisa returns a redirect/response. We usually parse the query parameters from the final URL 
    // or the response body if it's a direct API call.
    // However, usually Confirm.jsf redirects the USER. 
    // IF we are doing this server-to-server, we might get the HTML response or a redirect.
    
    // ALTERNATIVE: If your frontend is handling the redirect from Confirm.jsf, 
    // then *this* function is actually just an IPN handler or a final check.
    
    // BUT, assuming we want to check status manually or via IPN:
    // Let's assume this function is called when the user lands on Frontend with ?status=Success (Insecure)
    // OR we use the IPN flow.
    
    // SAFEST APPROACH (Double Check):
    // Since we cannot easily scrape the Confirm.jsf response (it returns HTML), 
    // we should rely on the query params the user brought back if we trust the hash (which we can't fully here).
    // OR use the "Inquire Transaction" API [cite: 309] if you have credentials for it.
    
    // FOR NOW, let's assume we are parsing the data provided by the frontend 
    // which extracted it from the URL after the SECOND redirect.
    // If you strictly need to verify, you MUST use the "Inquire Transaction" SOAP API.
    
    return { status: "PENDING_VERIFICATION" }; 
  } catch (error) {
    console.error("Easypaisa Verification Error:", error.message);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Payment verification failed");
  }
};

/**
 * HANDLE IPN / CALLBACK
 * This is the most reliable way to mark as paid.
 * Receives data from Easypaisa server directly.
 */
export const handleEasypaisaCallback = async (queryData) => {
  // Configured IPN attributes usually include: 
  // order_id, transaction_status, transaction_id, etc.
  
  // Note: Easypaisa IPN params might differ from your variable names. 
  // Adjust 'transaction_status' based on your actual IPN configuration in the portal.
  const { order_id, transaction_status, transaction_id } = queryData;

  const booking = await Booking.findOne({
    $or: [{ invoiceNumber: order_id }, { _id: order_id }],
  });

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found for payment callback");
  }

  const isSuccess = transaction_status === "PAID" || transaction_status === "Success";

  if (isSuccess) {
    if (booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      booking.paymentReference = transaction_id;
      await booking.save();

      // Distribute earnings
      await walletService.createBookingEarning(booking);
    }
  } else {
    booking.paymentStatus = "failed";
    booking.paymentReference = transaction_id || "FAILED";
    await booking.save();
  }

  return { booking, isSuccess };
};