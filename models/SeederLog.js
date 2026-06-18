import mongoose from "mongoose";

const seederLogSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true,
    enum: ["Product", "Purchase", "PurchaseItem", "Supplier"]
  },
  documentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  seederVersion: {
    type: String,
    default: "v1.0"
  },
  seededAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for fast rollback lookups
seederLogSchema.index({ modelName: 1, documentId: 1 });

export default mongoose.models.SeederLog || mongoose.model("SeederLog", seederLogSchema);
