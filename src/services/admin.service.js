// import httpStatus from "http-status";
// import ApiError from "../utils/ApiError.js";
// import { Kyc } from "../models/kyc.model.js";
// import { User } from "../models/user.model.js";

import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { Kyc } from "../models/kyc.model.js";
import { User } from "../models/user.model.js";



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
