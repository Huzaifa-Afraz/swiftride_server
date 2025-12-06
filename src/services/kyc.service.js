import httpStatus from "http-status";
import { Kyc } from "../models/kyc.model.js";
import { User, USER_ROLE } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const submitUserKyc = async (
  userId,
  { idFrontFile, idBackFile, liveSelfieFile, drivingLicenseFile }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (![USER_ROLE.CUSTOMER, USER_ROLE.HOST].includes(user.role)) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only customer or host can submit individual KYC"
    );
  }

  if (!idFrontFile || !idBackFile || !liveSelfieFile) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "All common KYC images are required"
    );
  }

  if (user.role === USER_ROLE.CUSTOMER && !drivingLicenseFile) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Driving license is required for customers"
    );
  }

  const payload = {
    user: userId,
    type: "individual",
    idFrontPath: idFrontFile.path,
    idBackPath: idBackFile.path,
    liveSelfiePath: liveSelfieFile.path,
    drivingLicensePath: drivingLicenseFile?.path,
    status: "pending"
  };

  let kyc = await Kyc.findOne({ user: userId, type: "individual" });

  if (kyc) {
    Object.assign(kyc, payload);
    await kyc.save();
  } else {
    kyc = await Kyc.create(payload);
  }

  return kyc;
};

export const submitShowroomKyc = async (
  userId,
  {
    idFrontFile,
    idBackFile,
    liveSelfieFile,
    registrationCertFile,
    taxCertFile,
    otherDocFile
  }
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== USER_ROLE.SHOWROOM) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Only showroom accounts can submit showroom KYC"
    );
  }

  if (!idFrontFile || !idBackFile || !liveSelfieFile || !registrationCertFile) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Required showroom KYC documents are missing"
    );
  }

  const payload = {
    user: userId,
    type: "showroom",
    idFrontPath: idFrontFile.path,
    idBackPath: idBackFile.path,
    liveSelfiePath: liveSelfieFile.path,
    showroomDocs: {
      registrationCertPath: registrationCertFile.path,
      taxCertPath: taxCertFile?.path,
      otherDocPath: otherDocFile?.path
    },
    status: "pending"
  };

  let kyc = await Kyc.findOne({ user: userId, type: "showroom" });

  if (kyc) {
    Object.assign(kyc, payload);
    await kyc.save();
  } else {
    kyc = await Kyc.create(payload);
  }

  return kyc;
};
