import Contact from "../../models/Contact.js";

export const getContacts = async (req, res) => {
    try {
        const contacts = await Contact.find({}).sort({ createdAt: -1 });

        res.json({ success: true, contacts });
    } catch (error) {
        console.error("Error fetching contact queries:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
