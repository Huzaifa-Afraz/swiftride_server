import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import crypto from "crypto";
import { PasswordResetToken } from "../models/passwordReset.model.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import { User, USER_ROLE } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { Kyc } from "../models/kyc.model.js";
import verifyGoogleToken from "../helpers/googleAuth.helper.js";

// const sanitizeUser = (user) => {
//   const obj = user.toObject();
//   delete obj.password;
//   return obj;
// };
export const sanitizeUser = (userDoc) => {
  if (!userDoc) return null;
  const u = userDoc.toObject ? userDoc.toObject() : userDoc;

  return {
    _id: u._id,
    fullName: u.fullName,
    showroomName: u.showroomName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    role: u.role,
    profilePicture: u.profilePicture,
    status: u.status,
    isEmailVerified: !!u.isEmailVerified,
    isVerified: !!u.isVerified, // friendly flag
    isKycApproved: !!u.isVerified, // legacy flag
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
};

export const generateAuthToken = (user) => {
  const payload = {
    sub: user._id,
    role: user.role,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  return { accessToken: token };
};

export const signupUser = async ({
  fullName,
  email,
  phoneNumber,
  password,
  role,
}) => {
  if (
    !role ||
    ![USER_ROLE.CUSTOMER, USER_ROLE.HOST, USER_ROLE.BOTH].includes(role)
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role for user signup");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    fullName,
    email,
    phoneNumber,
    password: hashedPassword,
    role,
  });

  return sanitizeUser(user);
};

// export const loginUser = async (email, password) => {
//   const user = await User.findOne({ email, role: { $ne: USER_ROLE.SHOWROOM } });

//   if (!user) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
//   }

//   const isMatch = await bcrypt.compare(password, user.password || "");
//   if (!isMatch) {
//     throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
//   }

//   const tokens = generateAuthToken(user);
//   return { user: sanitizeUser(user), tokens };
// };

export const loginUser = async (email, password) => {
  console.log("Attempting login for email:", email, password);
  // Same login for ALL roles
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, user.password || "");
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const tokens = generateAuthToken(user);
  console.log(
    "Login successful for user:",
    user._id,
    "Role:",
    user.role,
    tokens
  );

  return { user: sanitizeUser(user), token: tokens?.accessToken };
};

export const signupShowroom = async ({ showroomName, email, password }) => {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(httpStatus.CONFLICT, "Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const showroomUser = await User.create({
    showroomName,
    email,
    password: hashedPassword,
    role: USER_ROLE.SHOWROOM,
  });

  return sanitizeUser(showroomUser);
};

export const loginShowroom = async (email, password) => {
  const showroomUser = await User.findOne({ email, role: USER_ROLE.SHOWROOM });

  if (!showroomUser) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const isMatch = await bcrypt.compare(password, showroomUser.password || "");
  if (!isMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid credentials");
  }

  const tokens = generateAuthToken(showroomUser);
  return { user: sanitizeUser(showroomUser), tokens };
};

export const googleLogin = async ({ idToken, role, showroomName }) => {
  if (!idToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, "idToken is required");
  }

  const payload = await verifyGoogleToken(idToken);
  const email = payload.email;
  const googleId = payload.sub;
  const fullName = payload.name;

  console.log("Google Payload:", JSON.stringify(payload, null, 2));

  let user = await User.findOne({ email });

  // First time google user
  if (!user) {
    // ... (existing creation logic)
    if (!role) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Role is required for new users");
    }
    if (role === USER_ROLE.SHOWROOM && !showroomName) {
      throw new ApiError(httpStatus.BAD_REQUEST, "showroomName is required when role is showroom");
    }

    user = await User.create({
      fullName: role === USER_ROLE.SHOWROOM ? undefined : fullName,
      showroomName: role === USER_ROLE.SHOWROOM ? showroomName : undefined,
      email,
      role,
      googleId,
      profilePicture: payload.picture, 
      isEmailVerified: true,
      isVerified: false,
      isKycApproved: false,
    });
  } else {
    // Link google id if missing
    let updates = false;
    if (!user.googleId) {
      user.googleId = googleId;
      updates = true;
    }
    // Sync Profile Picture if missing
    if (!user.profilePicture && payload.picture) {
        user.profilePicture = payload.picture;
        updates = true;
    }
    // Sync Full Name if missing (and not a showroom)
    if (!user.fullName && payload.name && user.role !== USER_ROLE.SHOWROOM) {
        user.fullName = payload.name;
        updates = true;
    }
    
    if (updates) await user.save();
  }

  const tokens = generateAuthToken(user);

  return { user: sanitizeUser(user), tokens };
};

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email });

  // For security, we don't throw if user not found.
  if (!user) {
    return; // silently ignore
  }

  // Invalidate previous tokens for this user (optional but cleaner)
  await PasswordResetToken.updateMany(
    { user: user._id, used: false, expiresAt: { $gt: new Date() } },
    { used: true }
  );

  // Generate random token
  const token = crypto.randomBytes(32).toString("hex");

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    used: false,
  });

  // Send email with plain token
  await sendPasswordResetEmail(user, token);
};

export const resetPasswordWithToken = async (token, newPassword) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetDoc = await PasswordResetToken.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() },
  });

  if (!resetDoc) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired password reset token"
    );
  }

  const user = await User.findById(resetDoc.user);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  resetDoc.used = true;
  await resetDoc.save();

  return user;
};

// export const getCurrentUser = async (userId) => {
//   const user = await User.findById(userId);

//   if (!user) {
//     console.error("User not found with ID:", userId);
//     throw new ApiError(httpStatus.NOT_FOUND, "User not found");
//   }
// console.log("Fetched user:", sanitizeUser(user));
//   return sanitizeUser(user);
// };

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    console.error("User not found with ID:", userId);
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  const sanitized = sanitizeUser(user);

  return sanitized;
};
