import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import * as paymentService from "../services/payment.service.js";

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

// Easypaisa callback
export const easypaisaCallback = catchAsync(async (req, res) => {
  const data = {
    ...req.query,
    ...req.body
  };

  const { isSuccess } = await paymentService.handleEasypaisaCallback(data);

  // For Easypaisa IPN-style callback, 200 is usually enough.
  // Frontend will use returnUrl to show UI.
  if (isSuccess) {
    return res.status(200).send("OK");
  } else {
    return res.status(200).send("FAILED");
  }
});
