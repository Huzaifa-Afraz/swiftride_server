import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`SwiftRide API running on http://localhost:${PORT}/api/`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
