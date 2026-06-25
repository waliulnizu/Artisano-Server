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
enum: ['Tutorial', 'Tool', 'Resource', 'Article', 'Brush', 'tutorial', 'tool', 'resource', 'article', 'brush'],
required: true,
},
// ==========================================
// 🚀 ADD: নতুন প্রাইস বা মূল্য ফিল্ড সংযোজন
// ==========================================
price: {
    type: Number,
    required: [true, "Artwork price is mandatory for commercial sales."],
    min: [0, "Price cannot be negative."],
    default: 15.00
},

subscriptionTier: {
type: String,
enum: ["free", "pro", "premium"],
default: "free"
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