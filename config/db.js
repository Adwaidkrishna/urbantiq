import mongoose from "mongoose";
import dns from "dns";

const connectDB = async () => {
  try {
    // Configure Node.js to use Google DNS to bypass potential local ISP/router DNS resolution issues
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB Connection Failed", error);
    process.exit(1);
  }
};

export default connectDB;