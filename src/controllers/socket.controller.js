import * as trackingService from "../services/tracking.service.js";

export const handleSocketConnection = (io, socket) => {

  // Renter/User joins the room to watch
  socket.on("join_tracking", (bookingId) => {
    socket.join(bookingId);
    console.log(`Socket ${socket.id} watching booking ${bookingId}`);
  });

  // Driver sends location
  socket.on("send_location", async (data) => {
    try {
      // data = { bookingId, lat, lng, heading, speed }
      
      // 1. Broadcast to Renter (Real-time speed)
      io.to(data.bookingId).emit("receive_location", data);

      // 2. Save to DB (Async, doesn't block UI)
      await trackingService.processLocationUpdate(data.bookingId, data);
      
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  });
};