// import httpStatus from "http-status";
// import { Booking } from "../models/booking.model.js";
// import { Car } from "../models/car.model.js";
// import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { Booking } from "../models/booking.model.js";
import { Car } from "../models/car.model.js";
import { User, USER_ROLE } from "../models/user.model.js";
import { generateInvoicePDF } from "./invoice.service.js";
import { sendBookingInvoiceEmail } from "../utils/email.js";
import * as walletService from "./wallet.service.js";

const pushStatusHistory = (booking, status, changedBy, note) => {
  booking.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy,
    note,
  });
};

const calculateDays = (start, end) => {
  const ms = end.getTime() - start.getTime();
  if (ms <= 0) return 0;
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

// export const createBooking = async (customerId, { carId, startDate, endDate }) => {
//   const car = await Car.findById(carId).populate("owner");
//   if (!car || car.status !== "active") {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Car not available for booking");
//   }

//   const start = new Date(startDate);
//   const end = new Date(endDate);

//   if (isNaN(start.getTime()) || isNaN(end.getTime())) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid dates");
//   }

//   if (end <= start) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "endDate must be after startDate"
//     );
//   }

//   const days = calculateDays(start, end);
//   if (days <= 0) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Booking duration must be at least 1 day"
//     );
//   }

//   // 🔒 Prevent overlapping bookings for this car
//   // Condition: existing.startDate < newEnd AND existing.endDate > newStart
//   const overlappingBooking = await Booking.findOne({
//     car: car._id,
//     status: { $in: ["pending", "confirmed"] },
//     startDate: { $lt: end },
//     endDate: { $gt: start }
//   });

//   if (overlappingBooking) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Car already booked for the selected dates. Please choose different dates."
//     );
//   }

//   const totalPrice = days * car.dailyPrice;

//   const booking = await Booking.create({
//     car: car._id,
//     customer: customerId,
//     owner: car.owner,
//     startDate: start,
//     endDate: end,
//     totalPrice,
//     status: "pending"
//   });

//   return booking;
// };

// export const createBooking = async (customerId, payload) => {
//   const { carId, startDate, endDate } = payload;

//   const customer = await User.findById(customerId);
//   if (!customer) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
//   }

//   if (customer.role !== USER_ROLE.CUSTOMER) {
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "Only customers can create bookings"
//     );
//   }

//   if (!customer.isKycApproved) {
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "Your KYC must be approved to book a car"
//     );
//   }

//   const car = await Car.findById(carId);
//   if (!car) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
//   }

//   // Cannot book own car
//   if (car.owner.toString() === customerId.toString()) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "You cannot book your own car"
//     );
//   }

//   const sDate = new Date(startDate);
//   const eDate = new Date(endDate);

//   if (isNaN(sDate) || isNaN(eDate) || sDate >= eDate) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Invalid booking dates provided"
//     );
//   }

//   // Overlap check – car already booked in this range (pending/confirmed)
//   const overlapping = await Booking.findOne({
//     car: carId,
//     status: { $in: ["pending", "confirmed"] },
//     $or: [
//       {
//         startDate: { $lte: eDate },
//         endDate: { $gte: sDate }
//       }
//     ]
//   });

//   if (overlapping) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Car is already booked in the selected dates"
//     );
//   }

//   const booking = await Booking.create({
//     car: carId,
//     customer: customerId,
//     owner: car.owner, // convenience
//     startDate: sDate,
//     endDate: eDate,
//     status: "pending"
//   });

//   return booking;
// };

export const createBooking = async (customerId, payload) => {
  const { carId, startDateTime, endDateTime } = payload;

  const car = await Car.findById(carId);
  if (!car) throw new ApiError(httpStatus.NOT_FOUND, "Car not found");

  const customer = await User.findById(customerId);
  if (!customer || customer.role !== USER_ROLE.CUSTOMER)
    throw new ApiError(httpStatus.BAD_REQUEST, "Only customers can book cars");

  if (!customer.isVerified)
    throw new ApiError(httpStatus.FORBIDDEN, "KYC must be approved");

  // self booking check
  if (car.owner.toString() === customerId)
    throw new ApiError(httpStatus.BAD_REQUEST, "You cannot book your own car");

  // --- NEW: Approval & Insurance Check ---
  if (car.approvalStatus !== "approved") {
    throw new ApiError(httpStatus.BAD_REQUEST, "Car is not approved for booking yet");
  }

  const bookingEnd = new Date(endDateTime);
  if (car.insuranceDetails?.expiryDate) {
    const expiry = new Date(car.insuranceDetails.expiryDate);
    if (expiry < bookingEnd) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Car insurance expires before the booking period ends"
      );
    }
  }
  // ---------------------------------------

  // const start = new Date(startDateTime);
  // const end = new Date(endDateTime);

  // if (start >= end)
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Invalid booking dates");

  // // overlap
  // const overlapping = await Booking.findOne({
  //   car: carId,
  //   status: { $in: ["pending", "confirmed", "ongoing"] },
  //   $or: [{ startDateTime: { $lte: end }, endDateTime: { $gte: start } }]
  // });

  // if (overlapping)
  //   throw new ApiError(httpStatus.BAD_REQUEST, "Car is already booked");

  // const hourlyRate = car.dailyPrice / 24;
  // const durationHours = Math.ceil(Math.abs(end - start) / 36e5);
  // const totalPrice = hourlyRate * durationHours;

  // const invoiceNumber = `INV-${Date.now()}-${Math.floor(
  //   Math.random() * 9999
  // )}`;

  // const booking = await Booking.create({
  //   car: carId,
  //   customer,
  //   owner: car.owner,
  //   startDateTime: start,
  //   endDateTime: end,
  //   durationHours,
  //   totalPrice,
  //   invoiceNumber,
  //   status: "pending"
  // });
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (start >= end) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid booking dates");
  }
  // ============================================
  // AVAILABILITY VALIDATION
  // ============================================
  if (car.availability) {
    // Check if car is marked as available
    if (car.availability.isAvailable === false) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "This car is currently not available for booking"
      );
    }

    // Check day of week
    const daysAllowed = car.availability.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
    const startDay = start.getDay(); // 0 = Sunday, 6 = Saturday
    const endDay = end.getDay();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    if (!daysAllowed.includes(startDay)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Car is not available on ${dayNames[startDay]}. Available days: ${daysAllowed.map(d => dayNames[d]).join(", ")}`
      );
    }

    if (!daysAllowed.includes(endDay)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Car is not available on ${dayNames[endDay]}. Available days: ${daysAllowed.map(d => dayNames[d]).join(", ")}`
      );
    }

    // Check time range
    const carStartTime = car.availability.startTime || "00:00";
    const carEndTime = car.availability.endTime || "23:59";

    const [carStartHour, carStartMin] = carStartTime.split(":").map(Number);
    const [carEndHour, carEndMin] = carEndTime.split(":").map(Number);

    // Convert UTC to PKT (UTC+5) for comparison
    // getHours() returns UTC hours, we need local Pakistan time
    const PKT_OFFSET_HOURS = 5;
    const bookingStartHour = (start.getUTCHours() + PKT_OFFSET_HOURS) % 24;
    const bookingStartMin = start.getUTCMinutes();
    const bookingEndHour = (end.getUTCHours() + PKT_OFFSET_HOURS) % 24;
    const bookingEndMin = end.getUTCMinutes();

    const carStartMinutes = carStartHour * 60 + carStartMin;
    const carEndMinutes = carEndHour * 60 + carEndMin;
    const bookingStartMinutes = bookingStartHour * 60 + bookingStartMin;
    const bookingEndMinutes = bookingEndHour * 60 + bookingEndMin;

    if (bookingStartMinutes < carStartMinutes) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Booking start time is too early. Car is available from ${carStartTime}`
      );
    }

    if (bookingEndMinutes > carEndMinutes) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `Booking end time is too late. Car must be returned by ${carEndTime}`
      );
    }
  }

  // ============================================
  // OVERLAP CHECK - Prevent double bookings
  // ============================================
  const overlapping = await Booking.findOne({
    car: carId,
    status: { $in: ["pending", "confirmed", "ongoing"] },
    $or: [{ startDateTime: { $lte: end }, endDateTime: { $gte: start } }]
  });

  if (overlapping) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Car is already booked for the selected time. Please choose different dates/times."
    );
  }

  const durationHours = Math.ceil(Math.abs(end - start) / 36e5);

  let pricePerHour = car.pricePerHour;
  if (!pricePerHour && car.pricePerDay) {
    pricePerHour = car.pricePerDay / 24;
  }
  if (!pricePerHour) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Car has no pricing configured");
  }

  const totalPrice = pricePerHour * durationHours;

  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 9999)}`;

  const booking = await Booking.create({
    car: carId,
    customer,
    owner: car.owner,
    startDateTime: start,
    endDateTime: end,
    durationHours,
    totalPrice,
    invoiceNumber,
    status: "pending",
    paymentStatus: "unpaid",
  });

  booking.statusHistory.push({
    status: "pending",
    changedAt: new Date(),
    changedBy: customerId,
  });
  await booking.save();
  return booking;
};

export const getCustomerBookings = async (customerId) => {
  return Booking.find({ customer: customerId })
    .populate("car")
    .sort({ createdAt: -1 });
};

export const getOwnerBookings = async (ownerId) => {
  return Booking.find({ owner: ownerId })
    .populate("car customer")
    .sort({ createdAt: -1 });
};

// export const updateBookingStatus = async (ownerId, bookingId, status) => {
//   const booking = await Booking.findById(bookingId).populate("car customer");

//   if (!booking) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//   }

//   if (booking.owner.toString() !== ownerId.toString()) {
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "You are not allowed to update this booking"
//     );
//   }

//   booking.status = status;
//   await booking.save();

//   return booking;
// };

// export const updateBookingStatus = async (bookingId, ownerId, newStatus) => {
//   const booking = await Booking.findById(bookingId).populate("customer");
//   if (!booking) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//   }

//   if (booking.owner.toString() !== ownerId.toString()) {
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "You are not allowed to modify this booking"
//     );
//   }

//   // When confirming, ensure customer has approved KYC
//   // if (newStatus === "confirmed") {
//   //   if (!booking.customer?.isKycApproved) {
//   //     throw new ApiError(
//   //       httpStatus.FORBIDDEN,
//   //       "Customer KYC is not approved. You cannot confirm this booking."
//   //     );
//   //   }
//   // }
// if (newStatus === "confirmed") {
//   const pdfPath = generateInvoicePDF(booking, car, customer);
//   booking.pdfPath = pdfPath;
//   await booking.save();
// }

//   booking.status = newStatus;
//   await booking.save();

//   return booking;
// };
// export const updateBookingStatus = async (
//   bookingId,
//   ownerId,
//   newStatus,
//   note
// ) => {
//   const booking = await Booking.findById(bookingId)
//     .populate("customer")
//     .populate("car")
//     .populate("owner");

//   if (!booking) {
//     throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
//   }

//   if (booking.owner._id.toString() !== ownerId.toString()) {
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "You are not allowed to modify this booking"
//     );
//   }

//   const allowedStatuses = ["pending", "confirmed", "ongoing", "completed", "cancelled"];
//   if (!allowedStatuses.includes(newStatus)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
//   }

//   // Simple workflow rules
//   const current = booking.status;
//   if (current === "completed" || current === "cancelled") {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Cannot change status of a completed/cancelled booking"
//     );
//   }

//   if (newStatus === "confirmed") {
//     if (!booking.customer.isKycApproved) {
//       throw new ApiError(
//         httpStatus.FORBIDDEN,
//         "Customer KYC is not approved. Cannot confirm booking."
//       );
//     }
//   }

//   booking.status = newStatus;
//   pushStatusHistory(booking, newStatus, ownerId, note);

//   // On confirm – generate invoice + email
//   const prevStatus = current; // store before change
//   if (newStatus === "confirmed") {
//     const pdfPath = generateInvoicePDF(
//       booking,
//       booking.car,
//       booking.customer,
//       booking.owner
//     );
//     booking.pdfPath = pdfPath;

//     // fire-and-forget email
//     (async () => {
//       try {
//         await sendBookingInvoiceEmail(
//           booking.customer,
//           booking,
//           pdfPath
//         );
//       } catch (err) {
//         console.error("Error sending invoice email:", err.message);
//       }
//     })();
//   }

//   await booking.save();
//     if (prevStatus !== "completed" && newStatus === "completed") {
//     await walletService.releaseBookingEarning(booking._id);
//   }
//   return booking;
// };
export const updateBookingStatus = async (
  bookingId,
  ownerId,
  newStatus,
  note
) => {
  console.log("Updating booking status:", {
    bookingId,
    ownerId,
    newStatus,
    note,
  });
  // return;
  const booking = await Booking.findById(bookingId)
    .populate("customer")
    .populate("car")
    .populate("owner");

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.owner._id.toString() !== ownerId.toString()) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to modify this booking"
    );
  }

  const allowedStatuses = [
    "pending",
    "confirmed",
    "ongoing",
    "completed",
    "cancelled",
  ];
  if (!allowedStatuses.includes(newStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status");
  }

  const prevStatus = booking.status;

  // Cannot modify final states
  if (prevStatus === "completed" || prevStatus === "cancelled") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot change status of a completed/cancelled booking"
    );
  }

  // Optional strict transition rules:
  // const allowedTransitions = {
  //   pending: ["confirmed", "cancelled"],
  //   confirmed: ["ongoing", "cancelled"],
  //   ongoing: ["completed", "cancelled"],
  //   completed: [],
  //   cancelled: []
  // };
  // if (!allowedTransitions[prevStatus].includes(newStatus)) {
  //   throw new ApiError(
  //     httpStatus.BAD_REQUEST,
  //     `Cannot change status from ${prevStatus} to ${newStatus}`
  //   );
  // }

  if (newStatus === "confirmed") {
    // if (booking.paymentStatus !== "paid") {
    //   throw new ApiError(
    //     httpStatus.BAD_REQUEST,
    //     "Booking payment is not completed. Cannot confirm booking."
    //   );
    // }
    if (!booking.customer.isVerified) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Customer KYC is not approved. Cannot confirm booking."
      );
    }
  }

  booking.status = newStatus;

  // Handover Secret Generation
  if (newStatus === "confirmed" && !booking.handoverSecret) {
    const { randomBytes } = await import('crypto');
    booking.handoverSecret = randomBytes(32).toString('hex');
  }

  pushStatusHistory(booking, newStatus, ownerId, note);

  // On confirm – generate invoice + email
  if (newStatus === "confirmed") {
    const pdfPath = await generateInvoicePDF(
      booking,
      booking.car,
      booking.customer,
      booking.owner
    );
    booking.pdfPath = pdfPath;

    (async () => {
      try {
        await sendBookingInvoiceEmail(booking.customer, booking, pdfPath);
      } catch (err) {
        console.error("Error sending invoice email:", err.message);
      }
    })();
  }

  await booking.save();

  // On completed – release wallet earnings
  if (prevStatus !== "completed" && newStatus === "completed") {
    await walletService.releaseBookingEarning(booking._id);
  }

  return booking;
};

// export const extendBooking = async (bookingId, customerId, newEndTime) => {
//   const booking = await Booking.findById(bookingId).populate("car");

//   if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

//   if (booking.customer.toString() !== customerId)
//     throw new ApiError(
//       httpStatus.FORBIDDEN,
//       "Only the customer can extend their booking"
//     );

//   if (booking.status !== "ongoing" && booking.status !== "confirmed")
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Booking must be active to extend"
//     );

//   const oldEnd = booking.endDateTime;
//   const newEnd = new Date(newEndTime);

//   if (newEnd <= oldEnd)
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "New end time must be later than current end time"
//     );

//   const hourlyRate = booking.car.dailyPrice / 24;
//   const extraHours = Math.ceil(Math.abs(newEnd - oldEnd) / 36e5);
//   const extraAmount = extraHours * hourlyRate;

//   // log extension
//   booking.extensions.push({
//     oldEnd,
//     newEnd,
//     extraHours,
//     extraAmount
//   });

//   booking.endDateTime = newEnd;
//   booking.totalPrice += extraAmount;
//   booking.isExtended = true;

//   await booking.save();
//   return booking;
// };

export const extendBooking = async (bookingId, customerId, newEndTime) => {
  const booking = await Booking.findById(bookingId).populate("car");

  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

  if (booking.customer.toString() !== customerId)
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only the customer can extend their booking"
    );

  if (booking.status !== "ongoing" && booking.status !== "confirmed")
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Booking must be active to extend"
    );

  const oldEnd = booking.endDateTime;
  const newEnd = new Date(newEndTime);

  if (newEnd <= oldEnd)
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "New end time must be later than current end time"
    );

  const hourlyRate = booking.car.dailyPrice / 24;
  const extraHours = Math.ceil(Math.abs(newEnd - oldEnd) / 36e5);
  const extraAmount = extraHours * hourlyRate;

  // log extension
  booking.extensions.push({
    oldEnd,
    newEnd,
    extraHours,
    extraAmount,
  });

  booking.endDateTime = newEnd;
  booking.totalPrice += extraAmount;
  booking.isExtended = true;

  await booking.save();
  return booking;
};

// Update booking's current location (for background tracking)
export const updateBookingLocation = async (bookingId, locationData) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) return null;

  booking.currentLocation = {
    lat: locationData.lat,
    lng: locationData.lng,
    heading: locationData.heading || 0,
    speed: locationData.speed || 0,
    updatedAt: locationData.updatedAt || new Date(),
  };

  await booking.save();
  return booking;
};

export const cancelBooking = async (bookingId, customerId) => {
  const booking = await Booking.findById(bookingId).populate("car");
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

  if (booking.customer.toString() !== customerId) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to cancel this booking"
    );
  }

  if (booking.status !== "pending" && booking.status !== "confirmed") {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Cannot cancel a booking that is ongoing or completed"
    );
  }

  booking.status = "cancelled";
  pushStatusHistory(booking, "cancelled", customerId, "Cancelled by customer");

  await booking.save();
  return booking;
};
