// src/validations/admin.validation.js
import Joi from "joi";

export const getAdminUsersQuerySchema = Joi.object({
  role: Joi.string()
    .valid("customer", "host", "showroom")
    .required(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const updateUserStatusSchema = Joi.object({
  status: Joi.string().valid("active", "banned").required(),
});
