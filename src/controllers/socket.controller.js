import * as trackingService from "../services/tracking.service.js";
import { Message } from "../models/message.model.js";
import { Chat } from "../models/chat.model.js";

export const handleSocketConnection = (io, socket) => {

  // --- TRACKING EVENTS ---
  socket.on("join_tracking", (bookingId) => {
    socket.join(bookingId);
    console.log(`Socket ${socket.id} watching booking ${bookingId}`);
  });

  socket.on("send_location", async (data) => {
    try {
      io.to(data.bookingId).emit("receive_location", data);
      await trackingService.processLocationUpdate(data.bookingId, data);
    } catch (error) {
      console.error("Tracking Error:", error);
    }
  });

  // --- CHAT EVENTS ---
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined chat ${chatId}`);
  });

  socket.on("send_message", async (data) => {
    console.log("SERVER RECEIVED MESSAGE:", data);
    // data = { chatId, senderId, content }
    try {
      const { chatId, senderId, content } = data;
      
      // 1. Save to DB
      const message = await Message.create({
        chat: chatId,
        sender: senderId,
        content
      });

      // 2. Populate sender details for UI
      await message.populate("sender", "fullName avatar");

      // 3. Update Chat's lastMessage
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: {
          content,
          sender: senderId,
          createdAt: new Date()
        }
      });

      // 4. Broadcast to Room
      console.log(`Broadcasting to room ${chatId}:`, message._id);
      io.to(chatId).emit("receive_message", message);

    } catch (error) {
      console.error("Chat Error:", error);
    }
  });
};