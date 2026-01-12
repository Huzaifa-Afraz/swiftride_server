import httpStatus from "http-status";
// import verifyGoogleToken from "../helpers/googleAuth.helper.js";
import * as authService from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { sendAdminNewUserEmail } from "../utils/email.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {
  requestPasswordReset,
  resetPasswordWithToken,
} from "../services/auth.service.js";

export const signupUser = catchAsync(async (req, res) => {
  const { fullName, email, phoneNumber, password, role } = req.body;

  const result = await authService.signupUser({
    fullName,
    email,
    phoneNumber,
    password,
    role,
  });

  // Fire-and-forget admin email (do not break signup if email fails)
  (async () => {
    try {
      await sendAdminNewUserEmail(result.user);
    } catch (err) {
      console.error("Error sending admin signup email:", err.message);
    }
  })();

  sendSuccessResponse(res, httpStatus.CREATED, "User registered successfully", {
    user: result.user,
    tokens: result.tokens,
  });
});

export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  console.log("Login attempt for email:", email);

  const result = await authService.loginUser(email, password);
  console.log("Setting cookie for user:", result.user._id);
  console.log("Token:", result.token);
  res.cookie("token", result.token, {
    httpOnly: true,
    secure: true, 
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  sendSuccessResponse(res, httpStatus.OK, "Login successful", {
    user: result.user,
    token: result.token,
  });
});

export const signupShowroom = catchAsync(async (req, res) => {
  const { showroomName, email, password } = req.body;

  const result = await authService.signupShowroom({
    showroomName,
    email,
    password,
  });

  (async () => {
    try {
      await sendAdminNewUserEmail(result.user);
    } catch (err) {
      console.error("Error sending admin showroom signup email:", err.message);
    }
  })();

  sendSuccessResponse(
    res,
    httpStatus.CREATED,
    "Showroom registered successfully",
    {
      user: result.user,
      tokens: result.tokens,
    }
  );
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  await requestPasswordReset(email);

  // Always send same message to avoid leaking which emails exist
  sendSuccessResponse(
    res,
    httpStatus.OK,
    "If an account with this email exists, a password reset link has been sent."
  );
});

export const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;

  const user = await resetPasswordWithToken(token, password);

  sendSuccessResponse(
    res,
    httpStatus.OK,
    "Password has been reset successfully.",
    { email: user.email }
  );
});

export const logout = catchAsync(async (req, res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return sendSuccessResponse(res, httpStatus.OK, "Logout successful");
});

export const getMe = catchAsync(async (req, res) => {
  const userId = req.user.id; // set by authenticate middleware

  const user = await authService.getCurrentUser(userId);

  // Shape: { success, message, data: { user } }
  sendSuccessResponse(res, httpStatus.OK, "Current user fetched", user);
});

export const changePassword = catchAsync(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // from authenticate middleware

  await authService.changePassword(userId, oldPassword, newPassword);

  sendSuccessResponse(res, httpStatus.OK, "Password changed successfully");
});

export const googleLogin = catchAsync(async (req, res) => {
  // Pass the request body to the service
  // Service handles verification, user creation/linking, and sanitization (including KYC flags)
  console.log("Google Login Request Body:", req.body);
  const result = await authService.googleLogin(req.body);

  // Set cookie for web clients
  res.cookie("token", result.tokens?.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  sendSuccessResponse(res, httpStatus.OK, "Google login successful", {
    user: result.user,
    token: result.tokens?.accessToken,
  });
});
