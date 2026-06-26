import mongoose from "mongoose";

// =========================================================================
// 🔒 👑 SUBSCRIPTION TIER UPLOAD LIMIT GUARD (New Independent Layer)
// =========================================================================
export const checkUploadLimit = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role; 
    const isPremium = req.user.isPremium || false;

    // মঙ্গুজ ডাইনামিক মডেল সলভার
    const Content = mongoose.model("Content");

    // ১. এই ইউজার অলরেডি কয়টি এসেট আপলোড করেছে তা কাউন্ট করা
    const uploadedCount = await Content.countDocuments({ author: userId });

    // ২. এডমিন হলে আনলিমিটেড বাইপাস
    if (userRole === "admin") {
      return next();
    }

    // ৩. রুলস: প্রিমিয়াম হলে লিমিট ৯, ফ্রি হলে লিমিট ৩
    const maxLimit = isPremium ? 9 : 3;

    if (uploadedCount >= maxLimit) {
      return res.status(403).json({
        success: false,
        message: `Upload Blocked: Your tier subscription limit reached (${uploadedCount}/${maxLimit} assets). Upgrade to VIP Room to unlock more space! 👑`
      });
    }

    next();
  } catch (error) {
    console.error("Tier Limit Middleware Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error enforcing rate limit constraints." });
  }
};