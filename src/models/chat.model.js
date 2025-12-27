import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    lastMessage: {
      content: { type: String },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: Date }
    },
    // Optional: link to a bookingContext/Car mainly to identify what this chat is about
    context: {
      booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking" }, // if related to booking
      car: { type: mongoose.Schema.Types.ObjectId, ref: "Car" } // if pre-booking inquiry
    }
  },
  { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
