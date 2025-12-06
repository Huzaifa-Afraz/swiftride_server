import Joi from "joi";

export const signupUserSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().min(6).max(20).optional(),
  password: Joi.string().min(6).max(50).required(),
  role: Joi.string().valid("customer", "host").required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required()
});

export const showroomSignupSchema = Joi.object({
  showroomName: Joi.string().min(2).max(150).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(50).required()
});

export const googleLoginSchema = Joi.object({
  idToken: Joi.string().required(),
  role: Joi.string().valid("customer", "host", "showroom").optional(),
  showroomName: Joi.string().min(2).max(150).optional()
});
