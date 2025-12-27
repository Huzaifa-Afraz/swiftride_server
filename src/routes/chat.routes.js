import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { getMyChats, getChatMessages, createOrGetChat, sendMessageHTTP } from "../controllers/chat.controller.js";

const router = express.Router();

router.use(authenticate); // All chat routes require auth

router.get("/", getMyChats); // Get list of conversations
router.post("/create", createOrGetChat); // Start conversation
router.get("/:chatId/messages", getChatMessages); // Get history
router.post("/:chatId/send", sendMessageHTTP); // Send message (HTTP)

export default router;
