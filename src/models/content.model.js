import mongoose from "mongoose";

const contentSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Content title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Content description is required"],
        },
      
        featuredImage: {
            type: String,
            required: [true, "Artwork featured image is required from Cloudinary"],    
        },
        category: {
            type: String,
            enum: ['tutorial', 'tool', 'resource', 'article'],
            required: true,
        },
        isPremiumOnly: {
            type: Boolean,
            default: true,
        },
        resourceLink: {
            type: String,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    { timestamps: true }
);

export const Content = mongoose.model("Content", contentSchema);