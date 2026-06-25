// ১. মঙ্গুজ প্যাকেজ ইম্পোর্ট করা
import mongoose from "mongoose";

// ২. স্কিমা বা ছাঁচ ডিফাইন করা
const commentSchema = new mongoose.Schema(
  {
    // ক) কোন আর্টওয়ার্কের কমেন্ট?
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content", // 'Content' মডেলের সাথে সম্পর্ক তৈরি করা হলো
      required: [true, "Artwork reference ID is mandatory for a comment."]
    },
    
    // খ) কমেন্টটি কে করেছে?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // 'User' মডেলের সাথে সম্পর্ক তৈরি করা হলো
      required: [true, "User reference ID is mandatory to know the author."]
    },
    
    // গ) কমেন্টের মূল কন্টেন্ট
    text: {
      type: String,
      required: [true, "Comment content cannot be empty."],
      trim: true, // ইউজারের ভুলে দেওয়া স্পেস (Space) অটো কেটে দেবে
      maxlength: [500, "Comment cannot exceed 500 characters for performance optimization."]
    }
  },
  { 
    // Mongoose documentation recommend করছে timestamps অন রাখতে। 
    // এটি অটোমেটিক 'createdAt' এবং 'updatedAt' তৈরি করে দেয়। এর ফলে ইউজার কখন কমেন্ট করেছে তা সহজে UI-তে দেখানো যায়।
    timestamps: true 
  }
);

// ৩. মডেল তৈরি করে এক্সপোর্ট করা
const Comment = mongoose.model("Comment", commentSchema);
export default Comment;