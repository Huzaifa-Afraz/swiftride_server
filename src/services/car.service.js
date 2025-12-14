import { Car } from "../models/car.model.js";
import { USER_ROLE } from "../models/user.model.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

const MAX_CARS_PER_USER = Number(process.env.MAX_CARS_PER_USER || 20);

export const createCar = async (ownerId, ownerRole, payload) => {
  // 1. Role check
  if (![USER_ROLE.HOST, USER_ROLE.SHOWROOM].includes(ownerRole)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only hosts or showrooms can list cars");
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
    ownerRole: ownerRole
  });

  return car;
};

export const getMyCars = async (ownerId) => {
  return await Car.find({ owner: ownerId });
};


export const searchCars = async (query) => {
  const { brand, minPrice, maxPrice } = query;
  // Build your search logic here, e.g.:
  const filter = {};
  if (brand) filter.make = { $regex: brand, $options: "i" };
  if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: Number(minPrice) };
  
  return await Car.find(filter);
};

export const updateCar = async (carId, userId, updateBody) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }

  // Security: Check ownership
  if (car.owner.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to update this car");
  }

  // Update fields
  Object.assign(car, updateBody);
  await car.save();
  return car;
};

// ✅ NEW: Delete Car
export const deleteCar = async (carId, userId) => {
  const car = await Car.findById(carId);
  if (!car) {
    throw new ApiError(httpStatus.NOT_FOUND, "Car not found");
  }

  if (car.owner.toString() !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, "You are not authorized to delete this car");
  }

  await Car.findByIdAndDelete(carId);
  return car;
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