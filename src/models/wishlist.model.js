// ১. মঙ্গুজ প্যাকেজ ইম্পোর্ট করা
import mongoose from "mongoose";

// ২. উইশলিস্ট স্কিমা ডিফাইন করা
const wishlistSchema = new mongoose.Schema(
  {
    // ক) কোন ইউজার উইশলিস্টে নিচ্ছেন?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // User মডেলের সাথে রিলেশন
      required: [true, "User reference is mandatory for wishlist tracking."]
    },
    
    // খ) কোন আর্টওয়ার্কটি তিনি পছন্দ করেছেন?
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content", // Content/Artwork মডেলের সাথে রিলেশন
      required: [true, "Artwork reference ID is mandatory for wishlist tracking."]
    }
  },
  { 
    // লেটেস্ট বেস্ট প্র্যাকটিস অনুযায়ী timestamps অন রাখা হলো, যাতে ইউজার দেখতে পারেন তিনি কবে এটি বুকমার্ক করেছিলেন।
    timestamps: true 
  }
);

// 👑 📌 অত্যন্ত ইম্পর্ট্যান্ট প্রফেশনাল ট্রিক (Compound Indexing):
// আমরা চাই না একজন ইউজার একই আর্টওয়ার্ক ভুল করে ২ বার উইশলিস্টে যুক্ত করুক।
// মঙ্গুজের কম্পাউন্ড ইনডেক্সিং নিয়ম ব্যবহার করে 'user' এবং 'artworkId' এর কম্বিনেশনকে UNIQUE (অনন্য) করে দেওয়া হলো।
wishlistSchema.index({ user: 1, artworkId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;