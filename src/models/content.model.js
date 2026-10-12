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
      enum: ['tutorial', 'tool', 'resource', 'article', 'brush', 'painting', 'digital', 'sculpture'],
      required: true,
      toLowerCase: true,
    },
    price: {
      type: Number,
      required: [true, "Artwork price is mandatory for commercial sales."],
      min: [0, "Price cannot be negative."],
      default: 15.00
    },
    status: {
      type: String,
      enum: ["available", "sold"], 
      default: "available",
    },
    isPremiumOnly: {
      type: Boolean,
      default: true,
    },
    resourceLink: {
      type: String,
      default: ""
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', 
      required: true
    }
  },
  { timestamps: true }
);

// =========================================================================
// =========================================================================
contentSchema.index({ createdAt: -1 });
contentSchema.index({ category: 1, createdAt: -1 });       // category filter + sort combo
contentSchema.index({ price: 1 });                         // price-low sort
contentSchema.index({ price: -1 });                        // price-high sort
contentSchema.index({ author: 1, createdAt: -1 });         // artist assets page

// 🔍 [PERFORMANCE]: Full-Text Index — $regex O(n) → $text O(log n)
contentSchema.index({ title: "text", description: "text" });

export const Content = mongoose.model("Content", contentSchema);