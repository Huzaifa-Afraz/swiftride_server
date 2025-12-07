import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import apiRoutes from "./routes/index.js";


import { notFoundHandler, errorHandler } from "./middlewares/error.middleware.js";



const app = express();


const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  })
);
// Middlewares
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan("dev"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "swiftride-api" });
});

// API routes
app.use("/api", apiRoutes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
