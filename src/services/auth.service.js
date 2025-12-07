import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { OAuth2Client } from "google-auth-library";
import crypto from "crypto";
import { PasswordResetToken } from "../models/passwordReset.model.js";
import { sendPasswordResetEmail } from "../utils/email.js";
import { User, USER_ROLE } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sanitizeUser = (user) => {
  const obj = user.toObject();
  delete obj.password;
  return obj;
};

export const generateAuthToken = (user) => {
  const payload = {
    sub: user._id,
    role: user.role
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });

  return { accessToken: token };
};

export const signupUser = async ({ fullName, email, phoneNumber, password, role }) => {
  if (!role || ![USER_ROLE.CUSTOMER, USER_ROLE.HOST, USER_ROLE.BOTH].includes(role)) {
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
    role
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
  console.log("Login successful for user:", user._id, "Role:", user.role, tokens);

  return { user: sanitizeUser(user), token:tokens?.accessToken };
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
    role: USER_ROLE.SHOWROOM
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

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  const email = payload.email;
  const googleId = payload.sub;
  const fullName = payload.name;

  let user = await User.findOne({ email });

  // First time google user
  if (!user) {
    let resolvedRole = role;
    if (!resolvedRole) {
      resolvedRole = USER_ROLE.CUSTOMER;
    }

    if (resolvedRole === USER_ROLE.SHOWROOM && !showroomName) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "showroomName is required when role is showroom"
      );
    }

    user = await User.create({
      fullName: resolvedRole === USER_ROLE.SHOWROOM ? undefined : fullName,
      showroomName: resolvedRole === USER_ROLE.SHOWROOM ? showroomName : undefined,
      email,
      role: resolvedRole,
      googleId,
      isEmailVerified: payload.email_verified
    });
  } else {
    // Link google id if missing
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
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

  const tokenHash = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await PasswordResetToken.create({
    user: user._id,
    tokenHash,
    expiresAt,
    used: false
  });

  // Send email with plain token
  await sendPasswordResetEmail(user, token);
};

export const resetPasswordWithToken = async (token, newPassword) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const resetDoc = await PasswordResetToken.findOne({
    tokenHash,
    used: false,
    expiresAt: { $gt: new Date() }
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




export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found");
  }

  return sanitizeUser(user);
};