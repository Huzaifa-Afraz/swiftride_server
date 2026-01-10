import * as trackingService from "../services/tracking.service.js";

export const handleSocketConnection = (io, socket) => {

  // --- TRACKING EVENTS ---
  socket.on("join_tracking", (bookingId) => {
    socket.join(bookingId);
    console.log(`Socket ${socket.id} watching booking ${bookingId}`);
  });

  socket.on("send_location", async (data) => {
    try {
      console.log(`📍 Location received for booking ${data.bookingId}:`, data.lat, data.lng);
      io.to(data.bookingId).emit("receive_location", data);
      console.log(`📡 Broadcasted to room ${data.bookingId}`);
      await trackingService.processLocationUpdate(data.bookingId, data);
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  });
};