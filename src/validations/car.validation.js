// server/src/validations/car.validation.js
import Joi from "joi";

export const createCarSchema = Joi.object({
  // Text Fields
  make: Joi.string().required(),
  model: Joi.string().required(),
  year: Joi.number().integer().min(1950).max(new Date().getFullYear() + 1).required(),
  color: Joi.string().required(),
  plateNumber: Joi.string().required(),
  
  // Prices
  pricePerDay: Joi.number().positive().required(),
  pricePerHour: Joi.number().positive().required(),
  
  // Specs
  seats: Joi.number().integer().min(1).max(100).required(),
  transmission: Joi.string().valid("Automatic", "Manual").required(),
  fuelType: Joi.string().valid("Petrol", "Diesel", "Hybrid", "Electric", "Other").required(),
  
  // Location (Since FormData sends nested objects differently, we allow object or individual fields)
  location: Joi.object({
    address: Joi.string().required(),
    lat: Joi.number().optional(),
    lng: Joi.number().optional()
  }).unknown(true).required(), // .unknown allows keys to pass if they come in weirdly via FormData

  // Optional
  features: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().optional()
});

export const searchCarsSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  brand: Joi.string().optional(),
  model: Joi.string().optional(),
  location: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  minYear: Joi.number().integer().min(1950).optional(),
  maxYear: Joi.number().integer().min(1950).optional()
});