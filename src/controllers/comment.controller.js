import Comment from "../models/comment.model.js";

// =========================================================================
// 📝 ১. নতুন কমেন্ট তৈরি করার লজিক (Create Comment)
// =========================================================================
export const createComment = async (req, res) => {
  try {
    const { artworkId, text } = req.body;
    const userId = req.user._id; 

    // ডাটাবেসে কমেন্ট ইনসার্ট করা
    const newComment = await Comment.create({
      artworkId,
      user: userId,
      text
    });

    const populatedComment = await newComment.populate("user", "name profileImage");

    return res.status(201).json({
      success: true,
      message: "Comment posted successfully! 💬",
      data: populatedComment
    });
  } catch (error) {
    console.error("Create Comment Error:", error);
    return res.status(500).json({ success: false, message: "Server encountered an error posting comment." });
  }
};

// =========================================================================
// 📥 ২. নির্দিষ্ট আর্টওয়ার্কের সব কমেন্ট তুলে আনার লজিক (Get Comments)
// =========================================================================
export const getArtworkComments = async (req, res) => {
  try {
    const { artworkId } = req.params;

    const comments = await Comment.find({ artworkId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error("Get Comments Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching comments for this asset." });
  }
};

// =========================================================================
// ✏️ ৩. কমেন্ট এডিট করার লজিক (Update Comment)
// =========================================================================
export const updateComment = async (req, res) => {
  try {
    const { commentId, text } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    // 🔒 সিকিউরিটি ভেরিফিকেশন: String কনভার্সন দিয়ে টাইপ মিসম্যাচ লক ফিক্স
    if (String(comment.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized asset manipulation block." });
    }

    comment.text = text;
    await comment.save();

    return res.status(200).json({
      success: true,
      message: "Comment modified successfully.",
      data: comment
    });
  } catch (error) {
    console.error("Update Comment Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error editing comment." });
  }
};

// =========================================================================
// 🗑️ ৪. কমেন্ট ডিলিট করার লজিক (Delete Comment)
// =========================================================================
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

    // 🔒 সিকিউরিটি ভেরিফিকেশন
    if (String(comment.user) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Unauthorized manipulation block." });
    }

    await comment.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Comment wiped from asset history successfully."
    });
  } catch (error) {
    console.error("Delete Comment Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error dropping comment." });
  }
};