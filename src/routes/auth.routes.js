import express from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  signupUserSchema,
  loginSchema,
  showroomSignupSchema,
  googleLoginSchema,
} from "../validations/auth.validation.js";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validations/password.validation.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Individual users (host / customer)
router.post("/signup", validate(signupUserSchema), authController.signupUser);

// One login for ALL roles (customer, host, showroom, admin)
router.post("/login", validate(loginSchema), authController.loginUser);

// Showroom signup
router.post(
  "/showroom/signup",
  validate(showroomSignupSchema),
  authController.signupShowroom
);

// Google auth (common entry point for all roles)
// router.post("/google", validate(googleLoginSchema), authController.googleLogin);
router.post(
  "/google-login",
  // validate(googleLoginSchema),
  authController.googleLogin
);
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.getMe);

export default router;
