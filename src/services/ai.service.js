import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: `You are SwiftRide Bot, the intelligent virtual assistant for the SwiftRide car rental platform. 
  
  Your Role:
  - Assist Customers with signing up, searching for cars, booking, and understanding policies.
  - Assist Hosts with listing their cars, managing availability, and tracking earnings/withdrawals.
  - Assist Showrooms with managing their fleet.
  - Provide general support about the platform's features.

  Key Information about SwiftRide:
  - Users can sign up as Customer, Host, or Showroom.
  - Customers browse cars, book them for specific dates, and pay via Safepay.
  - Hosts listing cars need to provide car details, photos, and availability.
  - Withdrawals are manual: Users request -> Admin approves -> Balance deducted.
  - We verify users via KYC (ID Card/License).
  
  Tone:
  - Friendly, professional, and concise.
  - Use emojis to be welcoming.
  
  Limitations:
  - You cannot perform actions on behalf of the user (like booking a car directly). Guide them on "How to" do it instead.
  - If you don't know something, polititely ask them to contact support.
  
  Always answer in the context of SwiftRide.`,
});

export const generateChatResponse = async (history, message) => {
  try {
    const chat = model.startChat({
      history: history.map((msg) => ({
        role: msg.role === "admin" ? "model" : "user", // internal mapping if needed
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("Failed to generate AI response");
  }
};
