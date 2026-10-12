import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    artworkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Content",
      required: [true, "Artwork reference ID is mandatory for a comment."]
    },
    
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference ID is mandatory to know the author."]
    },
    
    text: {
      type: String,
      required: [true, "Comment content cannot be empty."],
      trim: true,
      maxlength: [500, "Comment cannot exceed 500 characters for performance optimization."]
    }
  },
  { 
    timestamps: true 
  }
);

const Comment = mongoose.model("Comment", commentSchema);
export default Comment;