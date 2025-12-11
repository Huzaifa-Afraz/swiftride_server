// import httpStatus from "http-status";
// import * as carService from "../services/car.service.js";
// import { sendSuccessResponse } from "../utils/response.js";
// import catchAsync from "../utils/catchAsync.js";

// export const createCar = catchAsync(async (req, res) => {
//   const ownerId = req.user.id;
//   const payload = req.body;
//   const files = req.files?.images || [];

//   const car = await carService.createCar(ownerId, payload, files);

//   sendSuccessResponse(res, httpStatus.CREATED, "Car listed successfully", {
//     car
//   });
// });

import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import * as carService from "../services/car.service.js";
import { sendSuccessResponse } from "../utils/response.js";
import { Car } from "../models/car.model.js";
import { USER_ROLE } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

export const createCar = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const ownerRole = req.user.role; // host or showroom

  const payload = req.body;

  // Handle multer files:
  // If using .fields(), req.files.photos will be an array
  const rawFiles = Array.isArray(req.files)
    ? req.files
    : req.files?.photos || [];

  // Map to relative paths to store in DB
  const photos = rawFiles.map((f) => `/uploads/cars/${f.filename}`);

  console.log("Creating car with payload:", payload);
  console.log("Uploaded files:", rawFiles);

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

    photos,

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
        // You’re sending "[1,2,3,4,5]" as string – parse JSON safely
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
      // If frontend sends a comma-separated string
      if (typeof payload.features === "string") {
        return payload.features
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
      }
      // If it comes as array from form-data
      if (Array.isArray(payload.features)) return payload.features;
      return [];
    })()
  };

  const car = await carService.createCar(ownerId, ownerRole, carInput);

  sendSuccessResponse(res, httpStatus.CREATED, "Car listed successfully", {
    car
  });
});

export const getMyCars = catchAsync(async (req, res) => {
  const ownerId = req.user.id;

  const cars = await carService.getMyCars(ownerId);

  sendSuccessResponse(res, httpStatus.OK, "Your cars fetched successfully", {
    cars
  });
});

export const searchCars = catchAsync(async (req, res) => {
  const {
    page,
    limit,
    brand,
    model,
    location,
    minPrice,
    maxPrice,
    minYear,
    maxYear
  } = req.query;

  const result = await carService.searchCars(
    {
      brand,
      model,
      location,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minYear: minYear ? Number(minYear) : undefined,
      maxYear: maxYear ? Number(maxYear) : undefined
    },
    {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10
    }
  );

  sendSuccessResponse(res, httpStatus.OK, "Cars fetched successfully", result);
});



export const getCarById = catchAsync(async (req, res) => {
  const { carId } = req.params;

  const car = await carService.getCarById(carId);

  sendSuccessResponse(res, httpStatus.OK, "Car detail fetched successfully", {
    car
  });
});