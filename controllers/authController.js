import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import otpGenerator from "otp-generator";

import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";




export const register = async (req, res) => {

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields required" });
        }

        if (!validator.isEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const passwordRegex =
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W]).{8,}$/;

        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must contain capital, small, number and symbol"
            });
        }

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already registered"
            })
        }

        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            lowerCaseAlphabets: false,
            specialChars: false,
            digits: true
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({

            name,
            email,
            password: hashedPassword,
            otp,
            otpExpire: Date.now() + 5 * 60 * 1000

        });

        await user.save();

        await sendEmail(email, otp);

        return res.json({
            success: true,
            redirect: `/api/auth/verify-email?email=${email}`
        });

    }
    catch (error) {

        console.log(error)

        res.status(500).json({
            message: "Server Error"
        })

    }

};


export const verifyOTP = async (req, res) => {

    const { email, otp } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
        return res.json({
            success: false,
            message: "User not found"
        });
    }

    if (user.otpExpire < Date.now()) {
        return res.json({
            success: false,
            message: "OTP expired"
        });
    }

    if (user.otp !== otp) {
        return res.json({
            success: false,
            message: "Invalid OTP"
        });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpire = null;

    await user.save();

    return res.json({
        success: true,
        message: "Email verified successfully",
        redirect: "/api/auth/login"
    });

};


export const login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isVerified) {
            return res.json({
                success: false,
                message: "Please verify your email first"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.json({
                success: false,
                message: "Invalid password"
            });
        }

        /* ---------- GENERATE TOKEN ---------- */

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        /* ---------- SEND COOKIE ---------- */

        res.cookie("token", token, {
            httpOnly: true,//hacker injects JavaScript (XSS attack), they cannot steal the token.
            secure: false,//cookie works only on HTTPS. if it is true 
            sameSite: "lax",//This controls cross-site cookie sharing.CSRF attacks.
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.json({
            success: true,
            message: "Login successful",
            redirect: "/api/auth/home"
        });

    } catch (error) {

        console.error(error);

        return res.json({
            success: false,
            message: "Server error"
        });

    }

};

export const resendOTP = async (req, res) => {

    try {

        const { email } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            });
        }

        // generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000);

        user.otp = otp;
        user.otpExpire = Date.now() + 5 * 60 * 1000;

        await user.save();

        await sendEmail(email, otp);

        return res.json({
            success: true,
            message: "OTP sent again to your email"
        });

    } catch (error) {

        console.error(error);

        return res.json({
            success: false,
            message: "Failed to resend OTP"
        });

    }

};

export const forgotPassword = async (req, res) => {

    try {

        const { email } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.json({
                success: false,
                message: "User not found"
            })
        }

        const otp = Math.floor(100000 + Math.random() * 900000)

        user.otp = otp
        user.otpExpire = Date.now() + 5 * 60 * 1000

        await user.save()

        await sendEmail(email, otp)

        return res.json({
            success: true,
            redirect: `/api/auth/verify-reset-otp?email=${email}`
        })

    } catch (err) {

        console.log(err)

        return res.json({
            success: false,
            message: "Server error"
        })

    }

}

export const verifyResetOTP = async (req, res) => {

    const { email, otp } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        return res.json({
            success: false,
            message: "User not found"
        })
    }

    if (user.otpExpire < Date.now()) {
        return res.json({
            success: false,
            message: "OTP expired"
        })
    }

    if (user.otp != otp) {
        return res.json({
            success: false,
            message: "Invalid OTP"
        })
    }

    return res.json({
        success: true,
        redirect: `/api/auth/reset-password?email=${email}`
    })

}

export const resetPassword = async (req, res) => {

    const { email, password, confirmPassword } = req.body

    if (password !== confirmPassword) {
        return res.json({
            success: false,
            message: "Passwords do not match"
        })
    }

    const user = await User.findOne({ email })

    if (!user) {
        return res.json({
            success: false,
            message: "User not found"
        })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    user.password = hashedPassword
    user.otp = null
    user.otpExpire = null

    await user.save()

    return res.json({
        success: true,
        redirect: "/api/auth/login"
    })

}


/* ============================================================
   GET AUTH STATUS  — used by frontend to know if logged in
============================================================ */
export const getAuthStatus = async (req, res) => {

    try {

        const token = req.cookies.token;

        if (!token) {
            return res.json({ loggedIn: false });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("name email");

        if (!user) {
            return res.json({ loggedIn: false });
        }

        return res.json({
            loggedIn: true,
            user: { name: user.name, email: user.email }
        });

    } catch (err) {

        return res.json({ loggedIn: false });

    }

};


/* ============================================================
   LOGOUT  — clears the token cookie
============================================================ */
export const logout = (req, res) => {

    res.clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: false
    });

    return res.json({ success: true, message: "Logged out successfully" });

};


/* ============================================================
   GOOGLE OAUTH REDIRECT
============================================================ */
export const googleRedirect = (req, res) => {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

    const options = {
        redirect_uri,
        client_id,
        access_type: "offline",
        response_type: "code",
        prompt: "consent",
        scope: [
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
        ].join(" "),
    };

    const queryString = new URLSearchParams(options).toString();
    res.redirect(`${rootUrl}?${queryString}`);
};


/* ============================================================
   GOOGLE OAUTH CALLBACK
============================================================ */
export const googleCallback = async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.redirect("/api/auth/login?error=Google authentication failed");
    }

    try {
        const client_id = process.env.GOOGLE_CLIENT_ID;
        const client_secret = process.env.GOOGLE_CLIENT_SECRET;
        const redirect_uri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get("host")}/api/auth/google/callback`;

        // Exchange code for Google tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({
                code,
                client_id,
                client_secret,
                redirect_uri,
                grant_type: "authorization_code"
            })
        });

        const tokenData = await tokenRes.json();

        if (!tokenRes.ok || tokenData.error) {
            console.error("Google Token Exchange Error:", tokenData);
            const errMsg = tokenData.error_description || tokenData.error || "Unknown error";
            return res.redirect(`/api/auth/login?error=Failed to exchange token with Google. Details: ${encodeURIComponent(errMsg)}`);
        }

        const { access_token } = tokenData;

        // Fetch User Info from Google
        const userinfoRes = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`);
        const profile = await userinfoRes.json();

        if (!userinfoRes.ok || profile.error) {
            console.error("Google User Info Error:", profile);
            const errMsg = profile.error_description || profile.error || "Unknown error";
            return res.redirect(`/api/auth/login?error=Failed to fetch user profile. Details: ${encodeURIComponent(errMsg)}`);
        }

        const { email, name } = profile;

        if (!email) {
            return res.redirect("/api/auth/login?error=Email address not provided by Google");
        }

        // Find or create the user in the database
        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                name: name || email.split("@")[0],
                email,
                isVerified: true
            });
            await user.save();
        } else if (!user.isVerified) {
            // Auto-verify existing users if they log in via Google
            user.isVerified = true;
            await user.save();
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        // Set Cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: false, // works for local http dev
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.redirect("/api/auth/home");

    } catch (error) {
        console.error("Google Auth Callback Error:", error);
        return res.redirect("/api/auth/login?error=Internal server error during Google login");
    }
};
