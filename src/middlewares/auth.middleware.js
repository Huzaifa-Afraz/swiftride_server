import jwt from "jsonwebtoken";
import httpStatus from "http-status";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";

export const authenticate = async (req, res, next) => {
  try {
    
    // 1) Get token from cookie OR Authorization header
    const cookieToken = req.cookies?.token;
    // console.log("Cookie token:", cookieToken);
    const authHeader = req.headers.authorization || "";
    const headerToken = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7).trim()
      : null;

    // Prefer header token if both exist, else cookie
    const rawToken = headerToken || cookieToken;

    if (!rawToken) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Authorization token missing"
      );
    }

    // 2) Verify token
   const finalToken = headerToken || cookieToken;
const payload = jwt.verify(finalToken, process.env.JWT_SECRET);


    // Support either payload.sub or payload.id or payload.userId
    const userId = payload.sub || payload.id || payload.userId;

    if (!userId) {
      throw new ApiError(
        httpStatus.UNAUTHORIZED,
        "Invalid token payload (no user id)"
      );
    }

    // 3) Load user from DB
    const user = await User.findById(userId).select("_id role");
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, "User not found");
    }

    // 4) Attach to req
    req.user = { id: user._id.toString(), role: user.role };
    console.log("Authenticated user:", req.user);

    next();
  } catch (error) {
    next(
      error instanceof ApiError
        ? error
        : new ApiError(
            httpStatus.UNAUTHORIZED,
            "Invalid or expired token"
          )
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