import httpStatus from "http-status";
import * as kycService from "../services/kyc.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import {Kyc} from "../models/kyc.model.js"; // Import needed for getMyKyc

// Helper: Uploads file buffer to Cloudinary and returns the URL
const uploadField = async (files, fieldName, folder) => {
  if (files && files[fieldName] && files[fieldName][0]) {
    // We pass the BUFFER to Cloudinary
    return await uploadToCloudinary(files[fieldName][0].buffer, folder);
  }
  return null;
};

// 1. Individual KYC (host / customer)
export const submitUserKyc = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const files = req.files || {};

  console.log("Uploading User KYC files...");

  // A. Upload to Cloudinary First (Parallel Uploads for speed)
  const [idFrontUrl, idBackUrl, liveSelfieUrl, drivingLicenseUrl] = await Promise.all([
    uploadField(files, "id_front", "kyc_docs"),
    uploadField(files, "id_back", "kyc_docs"),
    uploadField(files, "live_selfie", "kyc_docs"),
    uploadField(files, "driving_license", "kyc_docs"),
  ]);

  console.log("Uploaded KYC URLs:", {
    idFrontUrl,
    idBackUrl,
    liveSelfieUrl,
    drivingLicenseUrl,
  });

  // B. Pass the URLs (Strings) to the Service, not the File Objects
  // const kyc = await kycService.submitUserKyc(userId, {
  //   idFront: idFrontUrl.secure,
  //   idBack: idBackUrl,
  //   liveSelfie: liveSelfieUrl,
  //   drivingLicense: drivingLicenseUrl,
  // });
  const kyc = await kycService.submitUserKyc(userId, {
    idFront: idFrontUrl?.secure_url || null,        // Key changed to match Service
    idBack: idBackUrl?.secure_url || null,          // Key changed to match Service
    liveSelfie: liveSelfieUrl?.secure_url || null,  // Key changed to match Service
    drivingLicense: drivingLicenseUrl?.secure_url || null
  });

  sendSuccessResponse(res, httpStatus.CREATED, "KYC submitted successfully", {
    kyc,
  });
});

// 2. Showroom KYC
export const submitShowroomKyc = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const files = req.files || {};

  console.log("Uploading Showroom KYC files...");

  // A. Upload to Cloudinary
  const [
    idFrontUrl,
    idBackUrl,
    liveSelfieUrl,
    regCertUrl,
    taxCertUrl,
    otherDocUrl
  ] = await Promise.all([
    uploadField(files, "id_front", "showroom_kyc"),
    uploadField(files, "id_back", "showroom_kyc"),
    uploadField(files, "live_selfie", "showroom_kyc"),
    uploadField(files, "registration_cert", "showroom_kyc"),
    uploadField(files, "tax_cert", "showroom_kyc"),
    uploadField(files, "other_doc", "showroom_kyc"),
  ]);

  // B. Pass URLs to Service
  // const kyc = await kycService.submitShowroomKyc(userId, {
  //   idFront: idFrontUrl,
  //   idBack: idBackUrl,
  //   liveSelfie: liveSelfieUrl,
  //   registrationCert: regCertUrl,
  //   taxCert: taxCertUrl,
  //   otherDoc: otherDocUrl,
  // });
  const kyc = await kycService.submitShowroomKyc(userId, {
    idFront: idFrontUrl?.secure_url || null,
    idBack: idBackUrl?.secure_url || null,  
    liveSelfie: liveSelfieUrl?.secure_url || null,
    registrationCert: regCertUrl?.secure_url || null,
    taxCert: taxCertUrl?.secure_url || null,
    otherDoc: otherDocUrl?.secure_url || null
  });

  sendSuccessResponse(res, httpStatus.CREATED, "Showroom KYC submitted successfully", { kyc });
});

// 3. Get Status
export const getMyKyc = catchAsync(async (req, res) => {
  // Simple DB query is fine here
  const kyc = await Kyc.findOne({ user: req.user.id });

  sendSuccessResponse(res, httpStatus.OK, "KYC status fetched", {
    status: kyc ? kyc.status : "missing",
    rejectionReason: kyc?.rejectionReason || null
  });
});