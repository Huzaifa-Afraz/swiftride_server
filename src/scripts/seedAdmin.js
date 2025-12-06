import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import { User, USER_ROLE } from "../models/user.model.js";

async function seedAdmin() {
  try {
    await connectDB();

    const email = "admin@gmail.com";
    const plainPassword = "12345678";

    let admin = await User.findOne({ email, role: USER_ROLE.ADMIN });

    if (admin) {
      console.log("Admin user already exists:", email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    admin = await User.create({
      fullName: "SwiftRide Admin",
      email,
      password: hashedPassword,
      role: USER_ROLE.ADMIN,
      isKycApproved: true
    });

    console.log("Admin user created:");
    console.log("Email:", email);
    console.log("Password:", plainPassword);

    process.exit(0);
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }
}

seedAdmin();
