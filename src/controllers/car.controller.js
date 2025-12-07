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

export const createCar = async (ownerId, ownerRole, payload) => {
  if (![USER_ROLE.HOST, USER_ROLE.SHOWROOM].includes(ownerRole)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only hosts or showrooms can list cars"
    );
  }

  const existingCount = await Car.countDocuments({ owner: ownerId });
  if (existingCount >= MAX_CARS_PER_USER) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You have reached the maximum car limit (${MAX_CARS_PER_USER})`
    );
  }

  const {
    make,
    model,
    year,
    color,
    plateNumber,
    pricePerHour,
    pricePerDay,
    seats,
    transmission,
    fuelType,
    photos,
    location,
    availability,
    features
  } = payload;

  const car = await Car.create({
    owner: ownerId,
    ownerRole,
    make,
    model,
    year,
    color,
    plateNumber,
    pricePerHour,
    pricePerDay,
    seats,
    transmission,
    fuelType,
    photos: photos || [],
    location,
    availability,
    features: features || []
  });

  return car;
};


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
