import jwt from "jsonwebtoken";
import User from "../../models/User.js";

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
