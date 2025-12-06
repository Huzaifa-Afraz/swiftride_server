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

export const createBooking = catchAsync(async (req, res) => {
  const customerId = req.user.id;
  const { carId, startDate, endDate } = req.body;

  const booking = await bookingService.createBooking(customerId, {
    carId,
    startDate,
    endDate
  });

  sendSuccessResponse(res, httpStatus.CREATED, "Booking created successfully", {
    booking
  });
});

export const updateBookingStatus = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const { bookingId } = req.params;
  const { status } = req.body;

  const booking = await bookingService.updateBookingStatus(
    bookingId,
    ownerId,
    status
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
