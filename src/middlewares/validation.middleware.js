import Joi from "joi";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";

export const validate =
  (schema, property = "body") =>
  async (req, res, next) => {
    try {
      const value = await schema.validateAsync(req[property], {
        abortEarly: false,
        allowUnknown: true,
        stripUnknown: true
      });

      req[property] = value;
      next();
    } catch (err) {
      const details = err.details?.map((d) => d.message).join(", ");
      console.log("Validation error:", details);
      next(new ApiError(httpStatus.BAD_REQUEST, details || "Validation error"));
    }
  };
