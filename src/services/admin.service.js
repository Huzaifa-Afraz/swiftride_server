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



export const getDashboardStats = async () => {
  // Users by role
  const [customerCount, hostCount, showroomCount] = await Promise.all([
    User.countDocuments({ role: "customer" }),
    User.countDocuments({ role: "host" }),
    User.countDocuments({ role: "showroom" }),
  ]);

  // KYC status (map "approved" => "verified")
  const [kycPending, kycApproved, kycRejected] = await Promise.all([
    Kyc.countDocuments({ status: "pending" }),
    Kyc.countDocuments({ status: "approved" }),
    Kyc.countDocuments({ status: "rejected" }),
  ]);

  // Cars
  const totalCars = await Car.countDocuments({});
  // Cars that are currently booked (confirmed or ongoing)
  const bookedCarIds = await Booking.distinct("car", {
    status: { $in: ["confirmed", "ongoing"] },
  });
  const bookedCount = bookedCarIds.length;
  const availableCount = Math.max(totalCars - bookedCount, 0);

  // Bookings by status
  const [pendingBookings, confirmedBookings, ongoingBookings, completedBookings, cancelledBookings] =
    await Promise.all([
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
      Booking.countDocuments({ status: "ongoing" }), 
      Booking.countDocuments({ status: "completed" }),
      Booking.countDocuments({ status: "cancelled" }),
    ]);

  // For chart simplification: treat "ongoing" as "confirmed"
  const bookingsStats = {
    pending: pendingBookings,
    confirmed: confirmedBookings + ongoingBookings, 
    completed: completedBookings,
    cancelled: cancelledBookings,
  };

  // Revenue: sum platformFee from paid bookings
  const revenueAgg = await Booking.aggregate([
    { $match: { paymentStatus: "paid" } }, // adjust if your field is different
    {
      $group: {
        _id: null,
        totalPlatformFee: { $sum: "$platformCommissionAmount" }, 
      },
    },
  ]);

  const totalPlatformFee =
    revenueAgg.length > 0 ? revenueAgg[0].totalPlatformFee : 0;

  return {
    users: {
      customer: customerCount,
      host: hostCount,
      showroom: showroomCount,
    },
    kyc: {
      pending: kycPending,
      verified: kycApproved, // "approved" -> "verified"
      rejected: kycRejected,
    },
    cars: {
      total: totalCars,
      available: availableCount,
      booked: bookedCount,
    },
    bookings: bookingsStats,
    revenue: {
      totalPlatformFee,
    },
  };
};

// 2 + 3 + 4) User listing for role = customer | host | showroom
export const getAdminUsers = async ({ role, page = 1, limit = 20 }) => {
  const allowedRoles = ["customer", "host", "showroom"];
  if (!allowedRoles.includes(role)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role filter");
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find({ role })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments({ role }),
  ]);

  // Preload car counts for host/showroom in a single aggregation
  let carCountMap = {};
  if (role === "host" || role === "showroom") {
    const ownerIds = users.map((u) => u._id);
    const carCounts = await Car.aggregate([
      { $match: { owner: { $in: ownerIds } } }, // adjust field "owner" to your schema
      {
        $group: {
          _id: "$owner",
          carCount: { $sum: 1 },
        },
      },
    ]);

    carCountMap = carCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.carCount;
      return acc;
    }, {});
  }

  const mappedUsers = users.map((user) => {
    const base = {
      _id: user._id,
      email: user.email,
      status: user.status || "active", // default
      isVerified: !!user.isVerified, // or user.kycStatus === "approved"
      createdAt: user.createdAt,
    };

    if (role === "customer") {
      return {
        ...base,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
      };
    }

    if (role === "host") {
      return {
        ...base,
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        carCount: carCountMap[user._id.toString()] || 0,
      };
    }

    // showroom
    return {
      ...base,
      showroomName: user.showroomName || user.fullName, // fallback if needed
      carCount: carCountMap[user._id.toString()] || 0,
    };
  });

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    users: mappedUsers,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  };
};

// Update user status: active / banned
export const updateUserStatus = async (userId, status) => {
  const allowedStatuses = ["active", "banned"];
  if (!allowedStatuses.includes(status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid status value");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  user.status = status;
  await user.save();

  // return minimal safe fields
  console.log(`Updated user ${userId} status to ${status}`);
  console.log(user);
  return {
    _id: user._id,
    fullName: user.fullName,
    showroomName: user.showroomName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    status: user.status,
    isVerified: !!user.isKycApproved,
    createdAt: user.createdAt,
  };
};


export const approveKyc = async (kycId) => {
  const kyc = await Kyc.findById(kycId);
  if (!kyc) {
    throw new ApiError(httpStatus.NOT_FOUND, "KYC record not found");
  }

  kyc.status = "approved";
  await kyc.save();
  console.log("kyc record approved:", kycId);
  console.log("kyc:", kyc);

  console.log("KYC approved for user:", kyc.user);

  const user = await User.findByIdAndUpdate(
    kyc.user,
    { isVerified: true },
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
    .populate("user", "fullName email role isVerified")
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
