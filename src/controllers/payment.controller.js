import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import * as paymentService from "../services/payment.service.js";

// Init Payment
export const initBookingPayment = catchAsync(async (req, res) => {
  const { bookingId } = req.params;

  const result = await paymentService.initBookingPayment(
    bookingId,
    req.user.id
  );

  sendSuccessResponse(
    res,
    httpStatus.OK,
    "Payment initialized successfully",
    result
  );
});

// Final Callback / IPN Handler
// Used for both the user redirect return AND server-to-server IPN
export const easypaisaCallback = catchAsync(async (req, res) => {
  // Easypaisa sends data in Query Params (GET) for redirects 
  // and sometimes creates a specific URL format for IPN.
  const data = { ...req.query, ...req.body };

  console.log("Easypaisa Callback Data:", data);

  const { isSuccess } = await paymentService.handleEasypaisaCallback(data);

  // If this is an IPN (Server-to-Server), simply return 200 OK
  // If this is a Browser Redirect, you might want to redirect to your frontend success page
  
  // Checking if it's likely a browser request (Accept header contains html)
  const acceptHeader = req.get("Accept") || "";
  
  if (acceptHeader.includes("text/html")) {
     // Redirect user to frontend
     const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
     const redirectPath = isSuccess ? "/payment/success" : "/payment/failed";
     return res.redirect(`${frontendUrl}${redirectPath}`);
  }

  // Otherwise, strictly API response
  if (isSuccess) {
    return res.status(200).send("OK");
  } else {
    return res.status(200).send("FAILED");
  }
});