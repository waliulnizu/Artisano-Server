import express from "express";
import { 
  createContent, 
  getPremiumContent, 
  getPublicContent, 
  updateContent, 
  deleteContent, 
  getArtistAssets, 
  getSingleArtwork 
} from "../controllers/content.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; 
import { upload } from "../middlewares/multer.middleware.js";
// 🚀 [IMPORT TIER LIMIT]: লিমিট চেক করার মিডলওয়্যারটি ইমপোর্ট করা হলো
import { checkUploadLimit } from "../middlewares/tierLimit.middleware.js";

const router = express.Router();

// =========================================================================
// 🛣️ রাউট ১: সম্পূর্ণ পাবলিক ফিড (সার্চ, ফিল্টার এবং লগইন ছাড়া সবার জন্য ওপেন 🔓)
// =========================================================================
router.get("/public-data", getPublicContent); 

// =========================================================================
// 🛣️ রাউট ২: ভিআইপি প্রিমিয়াম গ্যালারি (শুধু প্রিমিয়াম মেম্বার ও অ্যাডমিনদের জন্য 🔒)
// =========================================================================
router.get("/premium-data", protect, (req, res, next) => {
    // 👑 [SCHEMA SYNC]: ডাটাবেসের subscriptionTier প্রপার্টির সাথে চেক সিঙ্ক করা হলো
    const tier = req.user.subscriptionTier || "free";
    const isPremium = tier === "pro" || tier === "premium";

    if (req.user && (isPremium || req.user.role === "admin")) {
        return next(); 
    }
    return res.status(403).json({ success: false, message: "Premium Access Denied. Upgrade to Pro/Premium room." });
}, getPremiumContent);

// =========================================================================
// 🛣️ রাউট ৩: নতুন কন্টেন্ট তৈরি করার জন্য (🛡️ ১০০% আল্ট্রা-স্টেবল সিকিউরিটি চেইন)
// =========================================================================
router.post(
    "/create", 
    protect,                        // ১. ইউজার লগইন আছে কি না নিশ্চিত করা
    upload.single("featuredImage"), // ২. মাল্টিপার্ট ডাটা আগে পার্স করা (যেন সেশন/বডি ব্লক না হয়)
    checkUploadLimit,               // ৩. রোল এবং আপলোড কোটা একসাথে চেক করা (🛡️ নতুন কম্বাইন্ড গার্ড)
    createContent                   // ৪. ফাইনাল ডাটাবেস সেভ
);

// 🛣️ রাউট ৪: কন্টেন্ট এডিট/আপডেট করার জন্য (CRUD - Update)
router.put("/:id", upload.single("featuredImage"), protect, updateContent);

// 🛣️ রাউট ৫: কন্টেন্ট ডিলিট করার জন্য (CRUD - Delete)
router.delete("/:id", protect, deleteContent);

// 🛣️ রাউট６: লগইন করা আর্টিস্টের নিজস্ব এসেট দেখার জন্য
router.get("/artist-assets", protect, getArtistAssets);

// 🛣️ রাউট ৭: সিঙ্গেল আর্টওয়ার্ক ভিউ নোড (🔓 পাবলিক এক্সেস)
router.get("/:id", getSingleArtwork);

export default router;