import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../models/adminModel.js";

// 1. CONFIGURATION
dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/urbantiq";
const ADMIN_EMAIL = process.argv[2] || "admin@urbantiq.com";
const ADMIN_PASSWORD = process.argv[3] || "Admin@123";

/**
 * URBANTIQ ADMIN SEED SCRIPT
 * This script will create a new admin or update the existing one's password.
 * 
 * Usage:
 * node utils/adminSeed.js [email] [password]
 */
async function seedAdmin() {
    try {
        console.log("🚀 Starting Admin Seeding process...");
        console.log(`Connecting to: ${MONGO_URI}`);

        // 2. CONNECT TO DATABASE
        await mongoose.connect(MONGO_URI);
        console.log("✅ Successfully connected to MongoDB");

        // 3. HASH PASSWORD
        console.log(`Encrypting password for ${ADMIN_EMAIL}...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

        // 4. UPSERT ADMIN (Update if exists, or create new)
        const updateResult = await Admin.findOneAndUpdate(
            { email: ADMIN_EMAIL },
            { 
                email: ADMIN_EMAIL, 
                password: hashedPassword 
            },
            { 
                upsert: true, 
                new: true, 
                setDefaultsOnInsert: true 
            }
        );

        console.log("--------------------------------------------------");
        console.log("🎉 ADMIN CREATED/UPDATED SUCCESSFULLY!");
        console.log(`📧 Email:    ${ADMIN_EMAIL}`);
        console.log(`🔑 Password: ${ADMIN_PASSWORD} (stored securely as a bcrypt hash)`);
        console.log("--------------------------------------------------");
        console.log("You can now login at: /api/admin/login");

    } catch (error) {
        console.error("❌ ERROR SEEDING ADMIN:");
        console.error(error);
    } finally {
        await mongoose.connection.close();
        console.log("🔌 Database connection closed.");
        process.exit();
    }
}

// Check for missing environment variables
if (!process.env.MONGO_URI && !MONGO_URI) {
    console.error("❌ Error: MONGO_URI is missing in .env file");
    process.exit(1);
}

seedAdmin();
