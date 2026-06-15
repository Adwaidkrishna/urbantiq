import Contact from "../../models/Contact.js";

export const createContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }

        const newContact = await Contact.create({
            name: name.trim(),
            email: email.trim(),
            subject: subject.trim(),
            message: message.trim()
        });

        res.status(201).json({ success: true, message: "Your message has been sent successfully!" });
    } catch (error) {
        console.error("Error creating contact query:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
