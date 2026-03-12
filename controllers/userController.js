import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// temporary storage for pending registration
let pendingUser = {};


// ================= REGISTER =================
export const registerUser = async (req, res) => {
  try {

    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    email = email.toLowerCase().trim();

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // check if user already exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // store temporarily
    pendingUser = {
      name: name.trim(),
      email,
      password,
      otp,
      otpExpiry: Date.now() + 10 * 60 * 1000
    };

    console.log("OTP:", otp); // later send via email

    // redirect to OTP page
    return res.redirect(`/verify-otp?email=${email}`);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server Error" });
  }
};



// ================= VERIFY OTP =================
export const verifyOtp = async (req, res) => {

  try {

    const { email, otp } = req.body;

    if (!pendingUser.email || pendingUser.email !== email) {
      return res.status(400).json({ message: "No registration request found" });
    }

    if (pendingUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (pendingUser.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pendingUser.password, salt);

    // save user
    const newUser = new User({
      name: pendingUser.name,
      email: pendingUser.email,
      password: hashedPassword,
      isVerified: true
    });

    await newUser.save();

    // clear temp storage
    pendingUser = {};

    return res.redirect("/login");

  } catch (error) {

    console.error(error);
    return res.status(500).json({ message: "Server Error" });

  }

};



// ================= LOGIN =================
export const loginUser = async (req, res) => {

  try {

    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: false
    });

    return res.redirect("/home");

  } catch (error) {

    return res.status(500).json({ message: "Server Error" });

  }

};