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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));


// Serve uploaded files as static assets
app.use('/uploads', express.static('uploads'));

// 3. ADD DB CONNECTION MIDDLEWARE (The Magic Part)
// This ensures every request to Vercel checks if DB is connected
app.use(async (req, res, next) => {
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