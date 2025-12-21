import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier"; // You might need: npm install streamifier

export const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "swiftride_uploads" }, // Optional: organize in a folder
      (error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};