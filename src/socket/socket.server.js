// import http from "http";
import { Server } from "socket.io";
import { handleSocketConnection } from "../controllers/socket.controller.js";

let io; // keep singleton (important for serverless / hot reload safety)

export function initSocket(server, options = {}) {
  // const server = http.createServer(app);

  io = new Server(server, {
    cors: options.cors ?? {
      origin: options.allowedOrigins ?? "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => handleSocketConnection(io, socket));

  return { server, io };
}

export function getIO() {
  if (!io) throw new Error("Socket.IO not initialized. Call initSocket() first.");
  return io;
}
