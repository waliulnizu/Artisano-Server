import mongoose from "mongoose";

// =========================================================================
// 🔒 👑 THE PURCHASE GUARD MIDDLEWARE (Comment Controller Protection)
// =========================================================================
export const canCommentGuard = async (req, res, next) => {
  try {
    const { artworkId } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!artworkId) {
      return res.status(400).json({ success: false, message: "Missing required property: artworkId." });
    }

    const Content = mongoose.model("Content");
    
    const artwork = await Content.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ success: false, message: "Target artwork asset not found." });
    }

    if (String(artwork.author) === String(userId) || userRole === "admin") {
      return next();
    }

    if (!artwork.price || Number(artwork.price) === 0) {
      return next();
    }

    next();
  } catch (error) {
    console.error("Purchase Guard Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error verifying asset ownership." });
  }
};