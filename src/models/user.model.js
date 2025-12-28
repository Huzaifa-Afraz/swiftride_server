import mongoose from "mongoose";

const USER_ROLES = ["customer", "host", "showroom", "admin"];

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, trim: true },
    showroomName: { type: String, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phoneNumber: { type: String, trim: true },
    profilePicture: { type: String, default: "" },

    password: { type: String },

    role: {
      type: String,
      enum: USER_ROLES,
      required: true
    },
    status: {
      type: String,
      enum: ["active", "banned"],
      default: "active"
    },

    // Auth
    googleId: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false } // KYC verified

  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export const USER_ROLE = {
  CUSTOMER: "customer",
  HOST: "host",
  SHOWROOM: "showroom",
  ADMIN: "admin"
};
