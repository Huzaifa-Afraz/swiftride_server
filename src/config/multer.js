// import multer from "multer";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const uploadsRoot = path.join(__dirname, "..", "..", "uploads");

// // ensure base uploads directory exists
// if (!fs.existsSync(uploadsRoot)) {
//   fs.mkdirSync(uploadsRoot, { recursive: true });
// }

// const makeStorage = (folderName) =>
//   multer.diskStorage({
//     destination: (req, file, cb) => {
//       const dest = path.join(uploadsRoot, folderName);
//       fs.mkdirSync(dest, { recursive: true });
//       cb(null, dest);
//     },
//     filename: (req, file, cb) => {
//       const timestamp = Date.now();
//       const ext = path.extname(file.originalname);
//       const safeField = file.fieldname.replace(/\s+/g, "_").toLowerCase();
//       cb(null, `${safeField}_${timestamp}${ext}`);
//     }
//   });

// // For KYC documents
// const kycStorage = makeStorage("kyc");
// // For car images
// const carStorage = makeStorage("cars");

// export const kycUpload = multer({ storage: kycStorage });
// export const carUpload = multer({ storage: carStorage });


import multer from "multer";

// 1. Switch to Memory Storage (RAM)
// This prevents the "ReadOnly" crash on Vercel.
const storage = multer.memoryStorage();

// 2. Create Upload Instances
// We use the same memory storage for both. 
// You will specify the folder name ('kyc' or 'cars') later when sending to Cloudinary.

export const kycUpload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Optional: Limit to 5MB
});

export const carUpload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

export const profileUpload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit for profiles
});