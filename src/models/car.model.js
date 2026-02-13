import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    lat: { type: Number, required: false },
    lng: { type: Number, required: false }
  },
  { _id: false }
);

const availabilitySchema = new mongoose.Schema(
  {
    daysOfWeek: {
      type: [Number], // 0 = Sunday, 1 = Monday, ...
      default: [0, 1, 2, 3, 4, 5, 6]
    },
    startTime: {
      type: String, // '09:00'
      default: "00:00"
    },
    endTime: {
      type: String, // '17:00'
      default: "23:59"
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    ownerRole: {
      type: String,
      enum: ["host", "showroom"],
      required: true
    },

    make: { type: String, required: true },
    model: { type: String, required: true },
    year: { type: Number, required: true },
    color: { type: String, required: true },
    plateNumber: { type: String, required: true },

    pricePerHour: { type: Number, required: true },
    pricePerDay: { type: Number, required: true },

    seats: { type: Number, required: true },
    transmission: {
      type: String,
      enum: ["Automatic", "Manual"],
      required: true
    },
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Hybrid", "Electric", "Other"],
      required: true
    },

    photos: [{ type: String }], // local file paths

    location: { type: locationSchema, required: true },
    availability: { type: availabilitySchema, default: () => ({}) },

    features: [{ type: String }],

    // --- NEW: Approval & Insurance ---
    approvalStatus: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected", "suspended"],
      default: "pending"
    },
    
    insuranceDetails: {
      provider: { type: String }, // e.g., "State Life", "EFU"
      policyNumber: { type: String },
      startDate: { type: Date },
      expiryDate: { type: Date },
      type: { 
        type: String, 
        enum: ["Third-Party", "Comprehensive"] 
      },
      documentUrl: { type: String } // Cloudinary URL
    },

    rejectionReason: { type: String }, // If rejected
    adminNotes: { type: String },      // Admin internal notes
    
    approvedAt: { type: Date },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // --- NEW: Re-submission Limits ---
    reviewAttempts: { type: Number, default: 0 },
    isPermanentlyBanned: { type: Boolean, default: false },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const Car = mongoose.model("Car", carSchema);
