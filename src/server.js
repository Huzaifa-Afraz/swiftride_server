import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./socket/socket.server.js"; 

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();

    const server = http.createServer(app);

    // Attach Socket.IO here
    initSocket(server);

    server.listen(PORT, () => {
      console.log(`SwiftRide API running on http://localhost:${PORT}/api/`);
      console.log(`Socket.IO running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
