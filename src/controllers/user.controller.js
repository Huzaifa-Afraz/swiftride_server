import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { User } from "../models/user.model.js";
import { sendSuccessResponse } from "../utils/response.js";
import ApiError from "../utils/ApiError.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import streamifier from "streamifier";

export const updateProfilePicture = catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "No image file provided");
  }

  // Upload to Cloudinary using streamifier (since memory storage)
  let imageUrl = "";

  try {
     const streamUpload = (fileBuffer) => {
        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "swiftride/profiles", resource_type: "image" },
                (error, result) => {
                    if (result) {
                        resolve(result);
                    } else {
                        reject(error);
                    }
                }
            );
            streamifier.createReadStream(fileBuffer).pipe(stream);
        });
     };

     const uploadResult = await streamUpload(req.file.buffer);
     imageUrl = uploadResult.secure_url;

  } catch (error) {
     console.error("Cloudinary Upload Error:", error);
     throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Image upload failed");
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { profilePicture: imageUrl },
    { new: true }
  );

  sendSuccessResponse(res, httpStatus.OK, "Profile picture updated", {
    profilePicture: user.profilePicture,
  });
});

export const updateProfile = catchAsync(async (req, res) => {
  const { fullName, phoneNumber } = req.body;
  const userId = req.user.id; // from authenticate middleware

  const updates = {};
  if (fullName) updates.fullName = fullName;
  if (phoneNumber) updates.phoneNumber = phoneNumber;

  const user = await User.findByIdAndUpdate(userId, updates, { new: true });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  sendSuccessResponse(res, httpStatus.OK, "Profile updated successfully", {
    user,
  });
});
