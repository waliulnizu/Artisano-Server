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

    // 🚀 ইম্পোর্ট ক্র্যাশ এড়াতে সরাসরি ডাইনামিক মডেল রেফারেন্স
    const Content = mongoose.model("Content");
    
    const artwork = await Content.findById(artworkId);
    if (!artwork) {
      return res.status(404).json({ success: false, message: "Target artwork asset not found." });
    }

    // ওনারশিপ বাইপাস: আর্টিস্ট নিজে বা এডমিন সবসময় কমেন্ট করতে পারবেন
    if (String(artwork.author) === String(userId) || userRole === "admin") {
      return next();
    }

    // কমার্শিয়াল চেক: ফ্রি অ্যাসেট হলে পাস
    if (!artwork.price || Number(artwork.price) === 0) {
      return next();
    }

    // পেমেন্ট মক পিরিয়ডে সাময়িকভাবে পাস করানো হচ্ছে
    next();
  } catch (error) {
    console.error("Purchase Guard Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error verifying asset ownership." });
  }
};