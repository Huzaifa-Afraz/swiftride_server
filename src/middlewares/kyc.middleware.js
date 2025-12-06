import httpStatus from "http-status";
import { Kyc } from "../models/kyc.model.js";
import ApiError from "../utils/ApiError.js";

// Ensure current user has at least one approved KYC record
export const requireApprovedKyc = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
    }

    const approvedKyc = await Kyc.findOne({
      user: userId,
      status: "approved"
    });

    if (!approvedKyc) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "KYC not approved yet. Please complete KYC and wait for admin approval."
      );
    }

    // Attach KYC object if you want to use later
    req.kyc = approvedKyc;

    next();
  } catch (error) {
    next(error);
  }
};



// import httpStatus from "http-status";
// import ApiError from "../utils/ApiError.js";

// /**
//  * Require that the logged-in user has KYC approved.
//  * Use after `authenticate`.
//  */
// export const requireKycApproved = (req, res, next) => {
//   if (!req.user) {
//     return next(
//       new ApiError(httpStatus.UNAUTHORIZED, "Authentication required")
//     );
//   }

//   if (!req.user.isKycApproved) {
//     return next(
//       new ApiError(
//         httpStatus.FORBIDDEN,
//         "Your KYC is not approved yet. Please complete and wait for approval."
//       )
//     );
//   }

//   next();
// };


// // export const requireKycApproved = (req, res, next) => {
// //   if (!req.user) {
// //     return next(
// //       new ApiError(httpStatus.UNAUTHORIZED, "Authentication required")
// //     );
// //   }

// //   if (!req.user.isKycApproved) {
// //     return next(
// //       new ApiError(
// //         httpStatus.FORBIDDEN,
// //         "Your KYC is not approved yet. Please complete and wait for approval."
// //       )
// //     );
// //   }

// //   next();
// // };
