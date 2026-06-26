import mongoose from "mongoose";

// =========================================================================
// 🔒 👑 ULTRA-SAFE LIVE DB VERIFICATION & LIMIT GUARD
// =========================================================================
export const checkUploadLimit = async (req, res, next) => {
  try {
    // ১. সেশন বা কুকি থেকে শুধু মেইন ইউজার আইডিটা বের করা
    const sessionUser = req.user || req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in again." });
    }

    const userId = sessionUser._id || sessionUser.id;

    // ২. 🚀 [THE SMART FETCH]: সেশনের ওপর ভরসা না করে সরাসরি ডাটাবেস থেকে রিয়েল ডাটা তুলে আনা
    const User = mongoose.model("User");
    const liveUser = await User.findById(userId);

    if (!liveUser) {
      return res.status(404).json({ success: false, message: "User profile not found in database." });
    }

    // ৩. লাইভ ডাটাবেস থেকে রোল এবং সাবস্ক্রিপশন চেক
    const userRole = liveUser.role;
    const tier = liveUser.subscriptionTier || "free";
    const isPremium = tier === "pro" || tier === "premium";

    // আর্টিস্ট বা এডমিন না হলে সরাসরি ব্লক
    if (userRole !== "admin" && userRole !== "artist") {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied! Your current role is not registered as an Artist." 
      });
    }

    // এডমিন হলে আনলিমিটেড আপলোড বাইপাস
    if (userRole === "admin") {
      return next();
    }

    // ৪. কন্টেন্ট কাউন্ট ইঞ্জিন
    const Content = mongoose.model("Content");
    const uploadedCount = await Content.countDocuments({ author: userId });

    // ৫. কোটা রুলস: প্রিমিয়াম হলে লিমিট ৯, ফ্রি হলে লিমিট ৩
    const maxLimit = isPremium ? 9 : 3;

    if (uploadedCount >= maxLimit) {
      return res.status(403).json({
        success: false,
        message: `Upload Blocked: Your free tier subscription limit reached (${uploadedCount}/${maxLimit} assets). Upgrade to VIP Room to unlock more space! 👑`
      });
    }

    next();
  } catch (error) {
    console.error("Tier Limit Middleware Engine Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error enforcing rate limit constraints." });
  }
};