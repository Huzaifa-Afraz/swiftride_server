import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Authorization token missing");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
    }

    req.user = { id: user._id.toString(), role: user.role };
    console.log("Authenticated user:", req.user);
    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(httpStatus.UNAUTHORIZED, "Invalid or expired token")
    );
  }
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "Not authenticated");
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, "You do not have permission");
    }

    next();
  };
};