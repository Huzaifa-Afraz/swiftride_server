import Joi from "joi";

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().min(20).required(),
  password: Joi.string().min(6).max(50).required()
});
