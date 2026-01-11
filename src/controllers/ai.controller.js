import catchAsync from "../utils/catchAsync.js";
import { sendSuccessResponse } from "../utils/response.js";
import httpStatus from "http-status";
import * as aiService from "../services/ai.service.js";

export const chatWithBot = catchAsync(async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message) {
    return res.status(400).json({ message: "Message is required" });
  }

  const response = await aiService.generateChatResponse(history, message);

  sendSuccessResponse(res, httpStatus.OK, "Response generated", {
    reply: response
  });
});
