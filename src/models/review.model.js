import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: [true, "Artwork ID is mandatory to place a review."]
    },
    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required to verify the reviewer."]
    },
    
    rating: {
      type: Number,
      required: [true, "Rating score is mandatory."],
      min: [1, "Rating must be at least 1 star."],
      max: [5, "Rating cannot exceed 5 stars."]
    },
    
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

reviewSchema.index({ user: 1, artworkId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;