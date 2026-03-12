import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    image: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    status: {
        type: Boolean,
        default: true
    }

},
{ timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;