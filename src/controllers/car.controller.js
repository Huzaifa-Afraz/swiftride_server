import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import * as carService from "../services/car.service.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // 1. Import Helper

export const createCar = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const ownerRole = req.user.role; // host or showroom

  const payload = req.body;

  // Handy helpers for Multer fields
  const photosFiles = req.files?.photos || [];
  const insuranceFile = req.files?.insuranceDoc ? req.files.insuranceDoc[0] : null;

  console.log("Creating car with payload:", payload);
  console.log(`Uploading ${photosFiles.length} photos...`);

  // 1. Upload Photos
  const photoUploads = await Promise.all(
    photosFiles.map((file) => uploadToCloudinary(file.buffer, "car_photos"))
  );
  const photoUrls = photoUploads.map(result => result.secure_url);

  // 2. Upload Insurance Doc (if present)
  let insuranceDocUrl = null;
  if (insuranceFile) {
    console.log("Uploading insurance doc...");
    const uploadRes = await uploadToCloudinary(insuranceFile.buffer, "car_insurance");
    insuranceDocUrl = uploadRes.secure_url;
  }

  // 3. Prepare Input
  const carInput = {
    // ... Basic Fields
    make: payload.make,
    model: payload.model,
    year: payload.year ? Number(payload.year) : undefined,
    color: payload.color,
    plateNumber: payload.plateNumber,
    pricePerHour: payload.pricePerHour ? Number(payload.pricePerHour) : undefined,
    pricePerDay: payload.pricePerDay ? Number(payload.pricePerDay) : undefined,
    seats: payload.seats ? Number(payload.seats) : undefined,
    transmission: payload.transmission,
    fuelType: payload.fuelType,
    
    photos: photoUrls,

    location: {
      address: payload.locationAddress,
      lat: payload.locationLat !== undefined ? Number(payload.locationLat) : undefined,
      lng: payload.locationLng !== undefined ? Number(payload.locationLng) : undefined
    },

    availability: {
      startTime: payload.availabilityStartTime || "00:00",
      endTime: payload.availabilityEndTime || "23:59",
      isAvailable: payload.availabilityIsAvailable === "true" || payload.availabilityIsAvailable === true,
      daysOfWeek: (() => {
        if (!payload.availabilityDaysOfWeek) return [0, 1, 2, 3, 4, 5, 6];
        try {
          const parsed = JSON.parse(payload.availabilityDaysOfWeek);
          return Array.isArray(parsed) ? parsed : [0, 1, 2, 3, 4, 5, 6];
        } catch { return [0, 1, 2, 3, 4, 5, 6]; }
      })()
    },

    features: (() => {
      if (!payload.features) return [];
      if (typeof payload.features === "string") {
        return payload.features.split(",").map((f) => f.trim()).filter(Boolean);
      }
      return Array.isArray(payload.features) ? payload.features : [];
    })(),

    // --- NEW: Insurance Details ---
    insuranceDetails: {
      provider: payload.insuranceProvider,
      policyNumber: payload.insurancePolicyNumber,
      type: payload.insuranceType, // 'Third-Party' or 'Comprehensive'
      startDate: payload.insuranceStartDate, // YYYY-MM-DD
      expiryDate: payload.insuranceExpiryDate,
      documentUrl: insuranceDocUrl
    }
  };

  const car = await carService.createCar(ownerId, ownerRole, carInput);

  sendSuccessResponse(res, httpStatus.CREATED, "Car listed successfully (Pending Review)", {
    car
  });
});

export const updateCar = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const userId = req.user.id;
  const updateBody = req.body;
  const updatedCar = await carService.updateCar(carId, userId, updateBody);
  sendSuccessResponse(res, httpStatus.OK, "Car updated successfully", {
    car: updatedCar
  });
});

export const getMyCars = catchAsync(async (req, res) => {
  const cars = await carService.getMyCars(req.user.id);
  sendSuccessResponse(res, httpStatus.OK, "Your cars fetched successfully", { cars });
});

export const searchCars = catchAsync(async (req, res) => {
  const result = await carService.searchCars(req.query);
  sendSuccessResponse(res, httpStatus.OK, "Cars fetched successfully", result);
});

export const getCarById = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const car = await carService.getCarById(carId);
  sendSuccessResponse(res, httpStatus.OK, "Car detail fetched successfully", {
    car
  });
});

export const deleteCar = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const userId = req.user.id;
  await carService.deleteCar(carId, userId);
  sendSuccessResponse(res, httpStatus.OK, "Car deleted successfully");
});

// --- ADMIN CONTROLLERS ---

export const getCarsByStatus = catchAsync(async (req, res) => {
  const { status } = req.params; // or query
  // validate status enum?
  const cars = await carService.getCarsByStatus(status);
  sendSuccessResponse(res, httpStatus.OK, `Cars with status ${status} fetched`, { cars });
});

export const approveCar = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const adminId = req.user.id;
  const car = await carService.approveCar(carId, adminId);
  sendSuccessResponse(res, httpStatus.OK, "Car approved successfully", { car });
});

export const rejectCar = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const adminId = req.user.id;
  const { reason } = req.body;
  
  if (!reason) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Rejection reason is required" });
  }

  const car = await carService.rejectCar(carId, reason, adminId);
  sendSuccessResponse(res, httpStatus.OK, "Car rejected", { car });
});

export const suspendCar = catchAsync(async (req, res) => {
  const { carId } = req.params;
  const { reason } = req.body;
  const car = await carService.suspendCar(carId, reason);
  sendSuccessResponse(res, httpStatus.OK, "Car suspended", { car });
});