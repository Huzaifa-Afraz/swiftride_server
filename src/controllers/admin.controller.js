import catchAsync from "../utils/catchAsync.js";
import httpStatus from "http-status";
import { sendSuccessResponse } from "../utils/response.js";
import * as adminService from "../services/admin.service.js";
import { sendKycStatusEmail } from "../utils/email.js";

// export const getAllKyc = catchAsync(async (req, res) => {
//   const { status, type, page, limit } = req.query;

//   const result = await adminService.listKyc({
//     status,
//     type,
//     page,
//     limit
//   });

//   sendSuccessResponse(res, httpStatus.OK, "KYC records fetched", result);
// });

export const getAllKyc = catchAsync(async (req, res) => {
  const { status, type, page, limit, q } = req.query;

  const result = await adminService.listKyc({
    status,
    type,
    page,
    limit,
    q
  });

  sendSuccessResponse(res, httpStatus.OK, "KYC records fetched", result);
});



export const approveKyc = catchAsync(async (req, res) => {
  const { kycId } = req.params;

  const { kyc, user } = await adminService.approveKyc(kycId);

  (async () => {
    try {
      await sendKycStatusEmail({ user, kyc, status: "approved" });
    } catch (err) {
      console.error("Error sending KYC approval email:", err.message);
    }
  })();

  sendSuccessResponse(res, httpStatus.OK, "KYC approved successfully", {
    kyc
  });
});

export const rejectKyc = catchAsync(async (req, res) => {
  const { kycId } = req.params;
  const { reason } = req.body;

  const { kyc, user } = await adminService.rejectKyc(kycId, reason);

  (async () => {
    try {
      await sendKycStatusEmail({
        user,
        kyc,
        status: "rejected",
        reason
      });
    } catch (err) {
      console.error("Error sending KYC rejection email:", err.message);
    }
  })();

  sendSuccessResponse(res, httpStatus.OK, "KYC rejected", { kyc });
});
