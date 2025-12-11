import { Car } from "../models/car.model.js";
import { USER_ROLE } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import httpStatus from "http-status";

const MAX_CARS_PER_USER = 5;

export const createCar = async (ownerId, ownerRole, payload) => {
  // 1. Check Permissions
  if (![USER_ROLE.HOST, USER_ROLE.SHOWROOM].includes(ownerRole)) {
    throw new ApiError(httpStatus.FORBIDDEN, "Only hosts or showrooms can list cars");
  }

  // 2. Check Limits
  const existingCount = await Car.countDocuments({ owner: ownerId });
  if (existingCount >= MAX_CARS_PER_USER) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `You have reached the maximum car limit (${MAX_CARS_PER_USER})`
    );
  }

  // 3. Create in DB
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

export const getCarById = async (id) => {
  return await Car.findById(id).populate("owner", "fullName email");
};

export const searchCars = async (query) => {
  const { brand, minPrice, maxPrice } = query;
  // Build your search logic here, e.g.:
  const filter = {};
  if (brand) filter.make = { $regex: brand, $options: "i" };
  if (minPrice) filter.pricePerDay = { ...filter.pricePerDay, $gte: Number(minPrice) };
  
  return await Car.find(filter);
};