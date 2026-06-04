import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
  size: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  }
});

const variantSchema = new mongoose.Schema({
  color: {
    type: String, // hex code
    required: true
  },

  colorName: {
    type: String
  },

  images: [
    {
      type: String
    }
  ],

  sizes: [sizeSchema]

});

const productSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  offerPrice: {
    type: Number,
    min: 0
  },

  variants: [variantSchema],

  status: {
    type: Boolean,
    default: true
  },
  averageRating: {
    type: Number,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  }

}, { timestamps: true });


export default mongoose.model("Product", productSchema);