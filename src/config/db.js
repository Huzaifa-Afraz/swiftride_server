import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGO_URI is not defined in environment variables");
  }

  // 1. SAFETY CHECK: If already connected (or connecting), stop here.
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    await mongoose.connect(uri, {
      dbName: "swiftride_db"
    });
    console.log("MongoDB connected: swiftride_db");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // Only throw error if we are strictly in development/local
    // On Vercel, we might just want to log it and let the request fail naturally
    throw error;
  }
};

export default connectDB;