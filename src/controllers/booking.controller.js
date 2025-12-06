// import httpStatus from "http-status";
// import * as bookingService from "../services/booking.service.js";
// import { sendSuccessResponse } from "../utils/response.js";
// import catchAsync from "../utils/catchAsync.js";

// export const createBooking = catchAsync(async (req, res) => {
//   const customerId = req.user.id;
//   const booking = await bookingService.createBooking(customerId, req.body);

//   sendSuccessResponse(res, httpStatus.CREATED, "Booking created successfully", {
//     booking
//   });
// });

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import * as bookingService from "../services/booking.service.js";
import { sendSuccessResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import { Booking } from "../models/booking.model.js";

// export const createBooking = catchAsync(async (req, res) => {
//   const customerId = req.user.id;
//   const { carId, startDate, endDate } = req.body;

//   const booking = await bookingService.createBooking(customerId, {
//     carId,
//     startDate,
//     endDate
//   });

//   sendSuccessResponse(res, httpStatus.CREATED, "Booking created successfully", {
//     booking
//   });
// });
export const createBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);

  sendSuccessResponse(res, httpStatus.CREATED, "Booking created", {
    booking
  });
});


// export const updateBookingStatus = catchAsync(async (req, res) => {
//   const ownerId = req.user.id;
//   const { bookingId } = req.params;
//   const { status } = req.body;

//   const booking = await bookingService.updateBookingStatus(
//     bookingId,
//     ownerId,
//     status
//   );

//   sendSuccessResponse(res, httpStatus.OK, "Booking status updated", {
//     booking
//   });
// });


export const updateBookingStatus = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const { bookingId } = req.params;
  const { status, note } = req.body;

  const booking = await bookingService.updateBookingStatus(
    bookingId,
    ownerId,
    status,
    note
  );

  sendSuccessResponse(res, httpStatus.OK, "Booking status updated", {
    booking
  });
});




export const getMyBookings = catchAsync(async (req, res) => {
  const customerId = req.user.id;
  const bookings = await bookingService.getCustomerBookings(customerId);

  sendSuccessResponse(res, httpStatus.OK, "Your bookings fetched successfully", {
    bookings
  });
});

export const getOwnerBookings = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const bookings = await bookingService.getOwnerBookings(ownerId);

  sendSuccessResponse(res, httpStatus.OK, "Owner bookings fetched successfully", {
    bookings
  });
});

// export const updateBookingStatus = catchAsync(async (req, res) => {
//   const ownerId = req.user.id;
//   const bookingId = req.params.id;
//   const { status } = req.body;

//   const booking = await bookingService.updateBookingStatus(
//     ownerId,
//     bookingId,
//     status
//   );

//   sendSuccessResponse(res, httpStatus.OK, "Booking status updated", { booking });
// });



export const extendBooking = catchAsync(async (req, res) => {
  const booking = await bookingService.extendBooking(
    req.params.bookingId,
    req.user.id,
    req.body.newEndTime
  );

  sendSuccessResponse(res, httpStatus.OK, "Booking extended", { booking });
});


// export const downloadInvoice = catchAsync(async (req, res) => {
//   const booking = await Booking.findById(req.params.bookingId);

//   if (!booking || !booking.pdfPath) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Invoice not found");
//   }

//   return res.download(booking.pdfPath);
// });




export const downloadInvoice = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  const booking = await Booking.findById(bookingId);

  if (!booking || !booking.pdfPath) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invoice not available");
  }

  return res.download(booking.pdfPath);
});