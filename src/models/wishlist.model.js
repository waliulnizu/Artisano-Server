import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is mandatory for wishlist tracking."]
    },
    
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: [true, "Artwork reference ID is mandatory for wishlist tracking."]
    }
  },
  { 
    timestamps: true 
  }
);

wishlistSchema.index({ user: 1, artworkId: 1 }, { unique: true });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;