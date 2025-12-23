import httpStatus from "http-status";
import verifyGoogleToken from "../helpers/googleAuth.helper.js";
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

// export const googleLogin = catchAsync(async (req, res) => {
//   // We simply pass the request body to the service
//   // The service handles the KYC logic (isVerified: false)
//   const result = await authService.googleLogin(req.body);

//   sendSuccessResponse(res, httpStatus.OK, "Google login successful", {
//     user: result.user,
//     token: result.tokens?.accessToken || result.tokens, // Handle token structure safely
//   });
// });

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken, role } = req.body; // Role (customer/host) passed from frontend

    if (!idToken) {
      return res.status(400).json({ message: "Google Token is required" });
    }

    // 1. Verify Token
    const googleUser = await verifyGoogleToken(idToken);
    const { email, name, picture } = googleUser;

    // 2. Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // 3. If no user, Check if Role is provided
      if (!role) {
        return res.status(404).json({
          success: false,
          message: "User not found. Please sign up.",
          requiresSignup: true,
        });
      }

      // 4. Create New User (Only if role is provided)
      user = await User.create({
        name,
        email,
        profilePicture: picture,
        role: role, // Explicit role required
        isVerified: false, 
        isEmailVerified: true,
        provider: "google",
      });
    }

    // 4. Generate JWT (Same as your normal login)
    // const token = jwt.sign(
    //   { id: user._id, role: user.role },
    //   process.env.JWT_SECRET,
    //   {
    //     expiresIn: "7d",
    //   }
    // );

    const token = authService.generateAuthToken(user);
    
    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: false, // true on production/https
    //   sameSite: "lax",
    //   maxAge: 7 * 24 * 60 * 60 * 1000,  
    // });

    // res.status(200).json({
    //   success: true,
    //   token,
    //   user,
    // });


      res.cookie("token", token?.accessToken, {
    httpOnly: true,
    secure: true, 
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  sendSuccessResponse(res, httpStatus.OK, "Login successful", {
    user: user,
    token: token?.accessToken,
  });
  } catch (error) {
    next(error);
  }
};
