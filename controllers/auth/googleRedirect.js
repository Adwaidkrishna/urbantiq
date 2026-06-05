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
