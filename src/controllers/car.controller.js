import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import * as carService from "../services/car.service.js";
import { uploadToCloudinary } from "../utils/cloudinary.js"; // 1. Import Helper

export const createCar = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const ownerRole = req.user.role; // host or showroom

  const payload = req.body;

  // Handle multer files:
  // If using .fields(), req.files.photos might be the key
  // Or if using .array('photos'), req.files is the array directly
  // This logic handles both cases safely:
  let rawFiles = [];
  if (Array.isArray(req.files)) {
    rawFiles = req.files;
  } else if (req.files && req.files.photos) {
    rawFiles = req.files.photos;
  }

  console.log("Creating car with payload:", payload);
  console.log(`Uploading ${rawFiles.length} photos to Cloudinary...`);

  // 2. Upload photos to Cloudinary (Parallel)
  // We map the files to promises, then wait for all of them to finish.
  // The helper returns the Secure URL (string).
  const photos = await Promise.all(
    rawFiles.map((file) => uploadToCloudinary(file.buffer, "car_photos"))
  );



  // console.log(photos)
  const photoUrls = photos.map(result => result.secure_url);
  console.log(photoUrls)
  // return;
  // Convert flat form-data into car schema shape
  const carInput = {
    make: payload.make,
    model: payload.model,
    year: payload.year ? Number(payload.year) : undefined,
    color: payload.color,
    plateNumber: payload.plateNumber,

    pricePerHour: payload.pricePerHour
      ? Number(payload.pricePerHour)
      : undefined,
    pricePerDay: payload.pricePerDay
      ? Number(payload.pricePerDay)
      : undefined,

    seats: payload.seats ? Number(payload.seats) : undefined,
    transmission: payload.transmission,
    fuelType: payload.fuelType,

    // 3. Assign the Cloudinary URLs here
    photos: photoUrls,

    location: {
      address: payload.locationAddress,
      lat:
        payload.locationLat !== undefined
          ? Number(payload.locationLat)
          : undefined,
      lng:
        payload.locationLng !== undefined
          ? Number(payload.locationLng)
          : undefined
    },

    availability: {
      startTime: payload.availabilityStartTime || "00:00",
      endTime: payload.availabilityEndTime || "23:59",
      isAvailable:
        payload.availabilityIsAvailable === "true" ||
        payload.availabilityIsAvailable === true ||
        payload.availabilityIsAvailable === "1" ||
        payload.availabilityIsAvailable === 1,
      daysOfWeek: (() => {
        if (!payload.availabilityDaysOfWeek) return [0, 1, 2, 3, 4, 5, 6];
        try {
          const parsed = JSON.parse(payload.availabilityDaysOfWeek);
          return Array.isArray(parsed) ? parsed : [0, 1, 2, 3, 4, 5, 6];
        } catch {
          return [0, 1, 2, 3, 4, 5, 6];
        }
      })()
    },

    features: (() => {
      if (!payload.features) return [];
      if (typeof payload.features === "string") {
        return payload.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
      if (Array.isArray(payload.features)) return payload.features;
      return [];
    })()
  };

  const car = await carService.createCar(ownerId, ownerRole, carInput);

  sendSuccessResponse(res, httpStatus.CREATED, "Car listed successfully", {
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