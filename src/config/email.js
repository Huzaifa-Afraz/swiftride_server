import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

console.log("Configuring email transporter with:", {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS ? "******" : undefined
});
// Optional: verify connection at startup
transporter
  .verify()
  .then(() => {
    console.log("Email transporter ready");
  })
  .catch((err) => {
    console.error("Error configuring email transporter:", err.message);
  });

export default transporter;
