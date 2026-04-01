import razorpay from "../config/razorpay.js";
import crypto from "crypto";

// @desc    Create a Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
export const createPaymentOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        const options = {
            amount: amount * 100, // amount in the smallest currency unit (paise for INR)
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        console.log("Sending to Razorpay:", options);
        const order = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            order
        });
    } catch (error) {
        console.error("Razorpay Error Object:", JSON.stringify(error, null, 2));
        res.status(500).json({ success: false, message: error.description || "Error creating payment order" });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (isSignatureValid) {
            res.status(200).json({
                success: true,
                message: "Payment verified successfully"
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }
    } catch (error) {
        console.error("Razorpay Verify Payment Error:", error);
        res.status(500).json({ success: false, message: "Error verifying payment" });
    }
};
