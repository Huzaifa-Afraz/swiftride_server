import crypto from "crypto";
import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { Booking } from "../models/booking.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { sendSuccessResponse } from "../utils/response.js";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const generateHandoverSecret = () => {
  return crypto.randomBytes(32).toString("hex");
};

// 1. Host Scans QR Code
export const scanHandoverQR = catchAsync(async (req, res) => {
  const { qrCode } = req.body; // The secret from the QR
  const hostId = req.user.id;

  // Find booking with this secret
  // Note: handoverSecret is select: false, so we must explicitly select it
  const booking = await Booking.findOne({ handoverSecret: qrCode })
    .select("+handoverSecret")
    .populate("car customer");

  if (!booking) {
    throw new ApiError(httpStatus.NOT_FOUND, "Invalid QR Code");
  }

  // Security: Check if the logged-in user is the owner of the car
  if (booking.owner.toString() !== hostId) {
     throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to manage this booking");
  }

  // Check state to determine next step
  let step = "unknown";
  if (booking.status === "confirmed" && booking.handoverStatus === "pending") {
      step = "pickup";
  } else if (booking.status === "ongoing" && booking.handoverStatus === "active") {
      step = "return";
  } else {
      // Allow re-scanning if in intermediate states (e.g. pickup_scanned but images not uploaded yet)
      if (booking.handoverStatus === "pickup_scanned") step = "pickup";
      else if (booking.handoverStatus === "return_scanned") step = "return";
      else throw new ApiError(httpStatus.BAD_REQUEST, "Invalid booking state for scanning");
  }

  // Provide essential info to Host UI
  sendSuccessResponse(res, httpStatus.OK, "QR Verified", {
      bookingId: booking._id,
      customerName: booking.customer.fullName,
      carName: `${booking.car.brand} ${booking.car.model}`,
      step: step // 'pickup' or 'return'
  });
});

// Helper for multi-image upload
const uploadImagesToCloudinary = async (files) => {
    const urls = [];
    for (const file of files) {
        const result = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "swiftride/claims", resource_type: "image" },
                (error, result) => {
                    if (result) resolve(result);
                    else reject(error);
                }
            );
            streamifier.createReadStream(file.buffer).pipe(stream);
        });
        urls.push(result.secure_url);
    }
    return urls;
};

// 2. Submit Pickup Evidence & Start Trip
export const processPickup = catchAsync(async (req, res) => {
  const { bookingId } = req.body;
  const files = req.files; // Array of files

  if (!files || files.length < 4) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Minimum 4 images required for security/claims");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

  if (booking.owner.toString() !== req.user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized");
  }

  // Upload images
  const imageUrls = await uploadImages(files);

  // Update State
  booking.pickupImages = imageUrls;
  booking.handoverStatus = "active";
  booking.status = "ongoing"; // Start the trip officially
  booking.startDateTime = new Date(); // Adjust start time to actual pickup?? Optional.
  await booking.save();

  sendSuccessResponse(res, httpStatus.OK, "Trip Started Successfully", { booking });
});

// 3. Submit Return Evidence & Complete Trip
export const processReturn = catchAsync(async (req, res) => {
  const { bookingId } = req.body;
  const files = req.files;

  if (!files || files.length < 4) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Minimum 4 images required for return verification");
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new ApiError(httpStatus.NOT_FOUND, "Booking not found");

  if (booking.owner.toString() !== req.user.id) {
      throw new ApiError(httpStatus.FORBIDDEN, "Unauthorized");
  }

  // Upload images
  const imageUrls = await uploadImages(files);

  // Update State
  booking.returnImages = imageUrls;
  booking.handoverStatus = "completed";
  booking.status = "completed"; 
  // Process Return Payment / refunds here if needed
  
  await booking.save();

  sendSuccessResponse(res, httpStatus.OK, "Trip Completed Successfully", { booking });
});
