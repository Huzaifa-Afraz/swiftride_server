import Joi from "joi";

export const createBookingSchema = Joi.object({
  carId: Joi.string().required(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required()
});

export const updateBookingStatusSchema = Joi.object({
  status: Joi.string()
    .valid("confirmed", "cancelled", "completed")
    .required()
});
