import httpStatus from "http-status";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import * as carService from "../services/car.service.js"; // Import service

export const createCar = catchAsync(async (req, res) => {
  const ownerId = req.user.id;
  const ownerRole = req.user.role;
  
  // Extract images from Multer
  const images = req.files?.photos || [];
  
  // Prepare data for service
  const carData = {
    ...req.body,
    photos: images.map(file => file.path) // Store file paths
  };

  const car = await carService.createCar(ownerId, ownerRole, carData);

  sendSuccessResponse(res, httpStatus.CREATED, "Car listed successfully", { car });
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
  const car = await carService.getCarById(req.params.id);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }
  sendSuccessResponse(res, httpStatus.OK, "Car fetched successfully", { car });
});