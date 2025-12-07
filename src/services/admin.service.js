// import httpStatus from "http-status";
// import ApiError from "../utils/ApiError.js";
// import { Kyc } from "../models/kyc.model.js";
// import { User } from "../models/user.model.js";

import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { Kyc } from "../models/kyc.model.js";
import { User } from "../models/user.model.js";
import { Booking } from "../models/booking.model.js";
import { Car } from "../models/car.model.js";



export const approveKyc = async (kycId) => {
  const kyc = await Kyc.findById(kycId);
  if (!kyc) {
    throw new ApiError(httpStatus.NOT_FOUND, "KYC record not found");
  }

  kyc.status = "approved";
  await kyc.save();

  const user = await User.findByIdAndUpdate(
    kyc.user,
    { isKycApproved: true },
    { new: true }
  );

  return { kyc, user };
};

export const rejectKyc = async (kycId, reason) => {
  const kyc = await Kyc.findById(kycId);
  if (!kyc) {
    throw new ApiError(httpStatus.NOT_FOUND, "KYC record not found");
  }

  kyc.status = "rejected";
  kyc.rejectionReason = reason || "No reason provided";
  await kyc.save();

  const user = await User.findById(kyc.user);

  return { kyc, user };
};

// export const listKyc = async ({ status, type, page, limit }) => {
//   const filter = {};
//   if (status) filter.status = status;
//   if (type) filter.type = type;

//   page = Number(page) || 1;
//   limit = Number(limit) || 10;
//   const skip = (page - 1) * limit;

//   const data = await Kyc.find(filter)
//     .populate("user", "fullName email role")
//     .skip(skip)
//     .limit(limit)
//     .sort({ createdAt: -1 });

//   const total = await Kyc.countDocuments(filter);

//   return {
//     data,
//     page,
//     total,
//     totalPages: Math.ceil(total / limit)
//   };
// };



export const listKyc = async ({ status, type, page, limit, q }) => {
  const filter = {};

  if (status) filter.status = status;        // pending / approved / rejected
  if (type) filter.type = type;             // individual / showroom

  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const skip = (page - 1) * limit;

  // If search query provided, find matching users first
  if (q) {
    const text = q.trim();
    const users = await User.find({
      $or: [
        { fullName: { $regex: text, $options: "i" } },
        { email: { $regex: text, $options: "i" } },
        { role: { $regex: text, $options: "i" } }
      ]
    }).select("_id");

    const ids = users.map((u) => u._id);
    // If no users matched, ensure empty result
    if (ids.length === 0) {
      return { data: [], page, total: 0, totalPages: 0 };
    }
    filter.user = { $in: ids };
  }

  const data = await Kyc.find(filter)
    .populate("user", "fullName email role isKycApproved")
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Kyc.countDocuments(filter);

  return {
    data,
    page,
    total,
    totalPages: Math.ceil(total / limit)
  };
};



export const listBookings = async (query) => {
  let {
    status,
    paymentStatus,
    ownerId,
    customerId,
    ownerRole,
    fromDate,
    toDate,
    q,
    page,
    limit
  } = query;

  const filter = {};

  if (status) filter.status = status;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (ownerId) filter.owner = ownerId;
  if (customerId) filter.customer = customerId;

  // filter by owner role only if provided (host/showroom)
  if (ownerRole) {
    const owners = await User.find({ role: ownerRole }).select("_id");
    filter.owner = { $in: owners.map((u) => u._id) };
  }

  // date filter on startDateTime
  if (fromDate || toDate) {
    filter.startDateTime = {};
    if (fromDate) filter.startDateTime.$gte = new Date(fromDate);
    if (toDate) filter.startDateTime.$lte = new Date(toDate);
  }

  // search text on customer / owner
  let userFilterIds = null;
  if (q && q.trim().length > 0) {
    const text = q.trim();
    const users = await User.find({
      $or: [
        { fullName: { $regex: text, $options: "i" } },
        { email: { $regex: text, $options: "i" } }
      ]
    }).select("_id");

    userFilterIds = users.map((u) => u._id);
    if (userFilterIds.length === 0) {
      return { data: [], page: 1, total: 0, totalPages: 0 };
    }

    // match either customer or owner in that list
    filter.$or = [{ customer: { $in: userFilterIds } }, { owner: { $in: userFilterIds } }];
  }

  page = Number(page) || 1;
  limit = Number(limit) || 10;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    Booking.find(filter)
      .populate("customer", "fullName email role")
      .populate("owner", "fullName email role")
      .populate("car", "make model year photos location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  return {
    data,
    page,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

export const getBookingByIdForAdmin = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("customer", "fullName email role isKycApproved")
    .populate("owner", "fullName email role")
    .populate("car");

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");
  }

  return booking;
};
