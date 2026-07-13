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
      toLowerCase: true, // ডাটাবেসে সেভ হওয়ার সময় ক্যাপিটাল/স্মল লেটার ফিক্স করবে
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
      // 👑 [FIX]: মঙ্গুজের গ্লোবাল রিলেশনশিপ ক্র্যাশ এড়াতে অফিশিয়াল মডেল নেম 'User' এ রি-ম্যাপ করা হলো
      ref: 'User', 
      required: true
    }
  },
  { timestamps: true }
);

// =========================================================================
// 🚀 [PERFORMANCE]: MongoDB Query Indexes — Full collection scan এড়াতে
// =========================================================================
contentSchema.index({ createdAt: -1 });                    // ডিফল্ট sort (newest first)
contentSchema.index({ category: 1, createdAt: -1 });       // category filter + sort combo
contentSchema.index({ price: 1 });                         // price-low sort
contentSchema.index({ price: -1 });                        // price-high sort
contentSchema.index({ author: 1, createdAt: -1 });         // artist assets page

// 🔍 [PERFORMANCE]: Full-Text Index — $regex O(n) → $text O(log n)
// title ও description ফিল্ডে full-text search করা যাবে, index ব্যবহার হবে
contentSchema.index({ title: "text", description: "text" }); // একটি collection-এ শুধু একটি text index হয়

export const Content = mongoose.model("Content", contentSchema);