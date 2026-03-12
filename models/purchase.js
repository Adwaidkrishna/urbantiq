const mongoose = require("mongoose");

const purchaseItemSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
    batchId: { type: String }
});

const purchaseSchema = new mongoose.Schema({
    supplier: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    items: [purchaseItemSchema],
    grandTotal: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Purchase", purchaseSchema);
