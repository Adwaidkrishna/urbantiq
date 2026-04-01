import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({ override: true });

const razorpay = new Razorpay({
    key_id: (process.env.RAZORPAY_KEY_ID || "").trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || "").trim()
});

console.log("Razorpay initialized with Key ID:", process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID : "MISSING");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("CRITICAL: Razorpay API keys are missing in .env file!");
}

export default razorpay;