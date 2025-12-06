import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";

export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(httpStatus.NOT_FOUND, "Route not found");
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error.status || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message);
  }

  const response = {
    success: false,
    code: error.statusCode,
    message: error.message
  };

  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  res.status(error.statusCode).json(response);
};
