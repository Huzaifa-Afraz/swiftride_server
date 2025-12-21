//=====================
// below is the code for vercel deployment
//=====================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import apiRoutes from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";

// 1. IMPORT DB CONNECTION HERE
import connectDB from "./config/db.js"; 

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://swiftride-frontend.vercel.app"
];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]
};

// 1. APPLY CORS MIDDLEWARE
app.use(cors(corsOptions));

// 2. THE NUCLEAR FIX (Add this block exactly here)
// This forces Express to send "200 OK" for ANY 'OPTIONS' request immediately.
// It stops the request here so it NEVER reaches your auth middleware.
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Regular Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Serve uploaded files as static assets
app.use('/uploads', express.static('uploads'));

// 3. ADD DB CONNECTION MIDDLEWARE
app.use(async (req, res, next) => {
  // Optimization: Skip DB connection for OPTIONS requests (since we handled them above)
  if (req.method === "OPTIONS") return next();
  
  await connectDB();
  next();
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "swiftride-api 0.0.0" });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;