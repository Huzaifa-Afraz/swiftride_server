import httpStatus from "http-status";
import * as authService from "../services/auth.service.js";
import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import { sendAdminNewUserEmail } from "../utils/email.js";
import { requestPasswordReset, resetPasswordWithToken } from "../services/auth.service.js";

export const signupUser = catchAsync(async (req, res) => {
  const { fullName, email, phoneNumber, password, role } = req.body;

  const result = await authService.signupUser({
    fullName,
    email,
    phoneNumber,
    password,
    role
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
    tokens: result.tokens
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
    secure: false,        // true on production/https
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  });

  sendSuccessResponse(res, httpStatus.OK, "Login successful", {
    user: result.user,
    token: result.token
  });
});

export const signupShowroom = catchAsync(async (req, res) => {
  const { showroomName, email, password } = req.body;

  const result = await authService.signupShowroom({
    showroomName,
    email,
    password
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
      tokens: result.tokens
    }
  );
});

export const googleLogin = catchAsync(async (req, res) => {
  const { idToken, role, showroomName } = req.body;

  const result = await authService.googleLogin({ idToken, role, showroomName });

  // If this is a newly-created user via Google, you can optionally notify admin
  if (result.isNewUser) {
    (async () => {
      try {
        await sendAdminNewUserEmail(result.user);
      } catch (err) {
        console.error("Error sending admin Google signup email:", err.message);
      }
    })();
  }

  sendSuccessResponse(res, httpStatus.OK, "Google login successful", {
    user: result.user,
    tokens: result.tokens
  });
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
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/"
  });

  return sendSuccessResponse(res, httpStatus.OK, "Logout successful");
});
