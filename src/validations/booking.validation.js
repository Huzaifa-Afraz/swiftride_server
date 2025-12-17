import Joi from "joi";

export const createBookingSchema = Joi.object({
  carId: Joi.string().required(),
  startDateTime: Joi.date().iso().required(), // ✅ Changed from startDate
  endDateTime: Joi.date().iso().required(), // ✅ Changed from endDate
});

export const updateBookingStatusSchema = Joi.object({
  status: Joi.string().valid("confirmed", "cancelled", "completed").required(),
});
