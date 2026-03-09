import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../models/adminModel.js";
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const createAdmin = async () => {

    const email = "adwaiiiiid@gmail.com";
    const password = "Admin123!";

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new Admin({
        email,
        password: hashedPassword
    });

    await admin.save();

    console.log("Admin created successfully");

    process.exit();
};

//createAdmin();