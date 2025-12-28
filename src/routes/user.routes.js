import express from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { profileUpload } from "../config/multer.js";

const router = express.Router();

router.put(
  "/profile-picture",
  authenticate,
  profileUpload.single("image"), // Key must match frontend
  userController.updateProfilePicture
);

export default router;
