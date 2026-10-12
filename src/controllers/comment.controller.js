import Comment from "../models/comment.model.js";

// =========================================================================
// =========================================================================
export const createComment = async (req, res) => {
  try {
    const { artworkId, text } = req.body;
    const userId = req.user._id; 

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
// =========================================================================
export const updateComment = async (req, res) => {
  try {
    const { commentId, text } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

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
// =========================================================================
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.body;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found." });
    }

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

// =========================================================================
// 💬 Guestbook impressions left by the signed-in collector
// =========================================================================
export const getMyComments = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const comments = await Comment.find({ user: userId })
      .populate({ path: "artworkId", model: "Content", select: "title featuredImage price category" })
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    console.error("GET_MY_COMMENTS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error fetching your guestbook notes." });
  }
};