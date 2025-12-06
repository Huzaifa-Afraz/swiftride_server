import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    brand: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    year: {
      type: Number
    },
    dailyPrice: {
      type: Number,
      required: true
    },
    location: {
      type: String,
      trim: true
    },
    images: [
      {
        path: String // local path for now; later we can move to cloud
      }
    ],
    status: {
      type: String,
      enum: ["draft", "active", "inactive"],
      default: "draft"
    }
  },
  { timestamps: true }
);

export const Car = mongoose.model("Car", carSchema);
