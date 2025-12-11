// import httpStatus from "http-status";
// import { Car } from "../models/car.model.js";
// import ApiError from "../utils/ApiError.js";

// export const createCar = async (ownerId, payload, imageFiles = []) => {
//   if (!ownerId) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Owner is required");
//   }

//   const images = (imageFiles || []).map((file) => ({
//     path: file.path
//   }));

//   const car = await Car.create({
//     owner: ownerId,
//     title: payload.title,
//     description: payload.description,
//     brand: payload.brand,
//     model: payload.model,
//     year: payload.year,
//     dailyPrice: payload.dailyPrice,
//     location: payload.location,
//     images,
//     status: "active"
//   });

//   return car;
// };
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { Car } from "../models/car.model.js";
import { USER_ROLE } from "../models/user.model.js";
import mongoose from "mongoose";

const MAX_CARS_PER_USER = Number(process.env.MAX_CARS_PER_USER || 20);

export const createCar = async (ownerId, ownerRole, payload) => {
  // 1. Role check
  if (![USER_ROLE.HOST, USER_ROLE.SHOWROOM].includes(ownerRole)) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Only hosts or showrooms can list cars"
    );
  }

  // 2. Per-user car limit
  const existingCount = await Car.countDocuments({ owner: ownerId });
  if (existingCount >= MAX_CARS_PER_USER) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You have reached the maximum car limit (${MAX_CARS_PER_USER})`
    );
  }

  // 3. (Optional) Minimal validation
  if (!payload.make || !payload.model || !payload.year || !payload.plateNumber) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Make, model, year and plate number are required"
    );
  }

  // 4. Create car
  const car = await Car.create({
    ...payload,
    owner: ownerId,
    ownerRole
  });

  return car;
};


export const getMyCars = async (ownerId) => {
  return Car.find({ owner: ownerId }).sort({ createdAt: -1 });
};

export const searchCars = async (filters, pagination) => {
  const { page = 1, limit = 10 } = pagination;

  const query = { status: "active" };

  if (filters.brand) {
    query.brand = new RegExp(filters.brand, "i");
  }

  if (filters.model) {
    query.model = new RegExp(filters.model, "i");
  }

  if (filters.location) {
    query.location = new RegExp(filters.location, "i");
  }

  if (filters.minYear || filters.maxYear) {
    query.year = {};
    if (filters.minYear) query.year.$gte = filters.minYear;
    if (filters.maxYear) query.year.$lte = filters.maxYear;
  }

  if (filters.minPrice || filters.maxPrice) {
    query.dailyPrice = {};
    if (filters.minPrice) query.dailyPrice.$gte = filters.minPrice;
    if (filters.maxPrice) query.dailyPrice.$lte = filters.maxPrice;
  }

  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Car.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Car.countDocuments(query)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    items,
    page,
    limit,
    total,
    totalPages
  };
};



export const getCarById = async (carId) => {
  if (!mongoose.Types.ObjectId.isValid(carId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid car id");
  }

  const car = await Car.findById(carId)
    .populate("owner", "fullName showroomName role email phoneNumber")
    .lean();

  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }

  return car;
};