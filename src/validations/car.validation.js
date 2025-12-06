import Joi from "joi";

export const createCarSchema = Joi.object({
  title: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow("").max(2000).optional(),
  brand: Joi.string().allow("").max(100).optional(),
  model: Joi.string().allow("").max(100).optional(),
  year: Joi.number().integer().min(1950).max(new Date().getFullYear() + 1).optional(),
  dailyPrice: Joi.number().positive().required(),
  location: Joi.string().allow("").max(150).optional()
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
