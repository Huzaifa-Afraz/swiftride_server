// import httpStatus from "http-status";
// import { Booking } from "../models/booking.model.js";
// import { Car } from "../models/car.model.js";
// import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { Booking } from "../models/booking.model.js";
import { Car } from "../models/car.model.js";
import { User, USER_ROLE } from "../models/user.model.js";


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


export const createBooking = async (customerId, payload) => {
  const { carId, startDate, endDate } = payload;

  const customer = await User.findById(customerId);
  if (!customer) {
    throw new ApiError(httpStatus.NOT_FOUND, "Customer not found");
  }

  if (customer.role !== USER_ROLE.CUSTOMER) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only customers can create bookings"
    );
  }

  if (!customer.isKycApproved) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your KYC must be approved to book a car"
    );
  }

  const car = await Car.findById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }

  // Cannot book own car
  if (car.owner.toString() === customerId.toString()) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "You cannot book your own car"
    );
  }

  const sDate = new Date(startDate);
  const eDate = new Date(endDate);

  if (isNaN(sDate) || isNaN(eDate) || sDate >= eDate) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid booking dates provided"
    );
  }

  // Overlap check – car already booked in this range (pending/confirmed)
  const overlapping = await Booking.findOne({
    car: carId,
    status: { $in: ["pending", "confirmed"] },
    $or: [
      {
        startDate: { $lte: eDate },
        endDate: { $gte: sDate }
      }
    ]
  });

  if (overlapping) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Car is already booked in the selected dates"
    );
  }

  const booking = await Booking.create({
    car: carId,
    customer: customerId,
    owner: car.owner, // convenience
    startDate: sDate,
    endDate: eDate,
    status: "pending"
  });

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



export const updateBookingStatus = async (bookingId, ownerId, newStatus) => {
  const booking = await Booking.findById(bookingId).populate("customer");
  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  if (booking.owner.toString() !== ownerId.toString()) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "You are not allowed to modify this booking"
    );
  }

  // When confirming, ensure customer has approved KYC
  if (newStatus === "confirmed") {
    if (!booking.customer?.isKycApproved) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Customer KYC is not approved. You cannot confirm this booking."
      );
    }
  }

  booking.status = newStatus;
  await booking.save();

  return booking;
};
