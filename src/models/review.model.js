import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    // ক) কোন আর্টওয়ার্কের ওপর রিভিউ দেওয়া হচ্ছে?
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: [true, "Artwork ID is mandatory to place a review."]
    },
    
    // খ) কোন কাস্টমার রিভিউটি দিচ্ছেন?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required to verify the reviewer."]
    },
    
    // গ) স্টার রেটিং (১ থেকে ৫ এর মধ্যে সীমাবদ্ধ)
    rating: {
      type: Number,
      required: [true, "Rating score is mandatory."],
      min: [1, "Rating must be at least 1 star."],
      max: [5, "Rating cannot exceed 5 stars."]
    },
    
    // ঘ) রিভিউর মূল টেক্সট বা ফিডব্যাক
    comment: {
      type: String,
      required: [true, "Review description cannot be empty."],
      trim: true,
      maxlength: [1000, "Review content cannot exceed 1000 characters."]
    }
  },
  { 
    timestamps: true 
  }
);

// 👑 📌 কম্পাউন্ড ইনডেক্সিং (Compound Indexing for Anti-Spam Safeguard):
// একজন ক্রেতা যেন একটি আর্টওয়ার্কের ওপর কেবল একটিই রিভিউ দিতে পারেন (স্প্যামিং বা ডুপ্লিকেট রিভিউ রোধ করতে)।
reviewSchema.index({ user: 1, artworkId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;