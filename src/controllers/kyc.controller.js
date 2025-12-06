import httpStatus from "http-status";
import * as kycService from "../services/kyc.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";

// Individual KYC (host / customer)
export const submitUserKyc = catchAsync(async (req, res) => {
  const userId = req.user.id; // from auth middleware
  const files = req.files || {};

  console.log("Submitted files:", files);
  console.log("User role:", req.user.role);

  const kyc = await kycService.submitUserKyc(userId, {
    idFrontFile: files.id_front?.[0] || null,
    idBackFile: files.id_back?.[0] || null,
    liveSelfieFile: files.live_selfie?.[0] || null,
    drivingLicenseFile: files.driving_license?.[0] || null
  });

  sendSuccessResponse(res, httpStatus.CREATED, "KYC submitted successfully", {
    kyc
  });
});

// Showroom KYC
export const submitShowroomKyc = catchAsync(async (req, res) => {
  const userId = req.user.id; // showroom user
  const files = req.files || {};

  console.log("Submitted showroom files:", files);
  console.log("User role:", req.user.role);

  const kyc = await kycService.submitShowroomKyc(userId, {
    idFrontFile: files.id_front?.[0] || null,
    idBackFile: files.id_back?.[0] || null,
    liveSelfieFile: files.live_selfie?.[0] || null,
    registrationCertFile: files.registration_cert?.[0] || null,
    taxCertFile: files.tax_cert?.[0] || null,
    otherDocFile: files.other_doc?.[0] || null
  });

  sendSuccessResponse(
    res,
    httpStatus.CREATED,
    "Showroom KYC submitted successfully",
    { kyc }
  );
});
