import { Chat } from "../models/chat.model.js";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

// Get all chats for current user
export const getMyChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ participants: req.user._id })
      .populate("participants", "fullName email avatar role showroomName") // Show participant details
      .populate("lastMessage.sender", "fullName")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    next(error);
  }
};

// Get messages for a chat
export const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    
    // Verify participation
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) return res.status(404).json({ message: "Chat not found or access denied" });

    const messages = await Message.find({ chat: chatId })
      .populate("sender", "fullName avatar")
      .sort({ createdAt: 1 }); // Oldest first

    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// Create or Get existing chat (e.g. when clicking "Contact Host")
export const createOrGetChat = async (req, res, next) => {
  try {
    const { partnerId, carId } = req.body; // partnerId could be Host ID
    
    console.log("CreateChat - User:", req.user);
    console.log("CreateChat - Partner:", partnerId);

    const myId = req.user._id;

    if (!partnerId) return res.status(400).json({ message: "Partner ID required" });

    // Check if chat exists
    let chat = await Chat.findOne({
      participants: { $all: [myId, partnerId] },
      // Optional: if strictly one chat per car context, add context query
      // "context.car": carId 
    }).populate("participants", "fullName email avatar role showroomName");

    if (chat) {
      return res.json(chat);
    }

    // Create new
    const partner = await User.findById(partnerId);
    if (!partner) return res.status(404).json({ message: "User not found" });

    chat = await Chat.create({
      participants: [myId, partnerId],
      context: carId ? { car: carId } : undefined
    });

    // Populate for return
    chat = await chat.populate("participants", "fullName email avatar role showroomName");

    res.status(201).json(chat);
  } catch (error) {
    next(error);
  }
};

// HTTP Send Message (Fallback if Socket fails or specific use case)
export const sendMessageHTTP = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content
    });

    // Update last message
    chat.lastMessage = {
      content,
      sender: req.user._id,
      createdAt: new Date()
    };
    await chat.save();
    
    // Populate sender
    await message.populate("sender", "fullName avatar");

    res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};
