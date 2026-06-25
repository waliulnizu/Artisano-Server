import express from "express";
import { createContent, getPremiumContent, updateContent, deleteContent, getArtistAssets, getSingleArtwork } from "../controllers/content.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; 
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// =========================================================================
// 🛣️ রাউট ১: সম্পূর্ণ পাবলিক ফিড (হোমপেজের জন্য)
// =========================================================================
router.get("/public-data", protect, getPremiumContent);

// =========================================================================
// 🛣️ রাউট ২: ভিআইপি প্রিমিয়াম গ্যালারি (শুধু প্রো মেম্বারদের জন্য VIP রুম)
// =========================================================================
router.get("/premium-data", protect, (req, res, next) => {
    if (req.user && (req.user.isPremium || req.user.role === "admin")) {
        return next(); 
    }
    return res.status(403).json({ success: false, message: "Premium Access Denied" });
}, getPremiumContent);

// =========================================================================
// 🛣️ রাউট ৩: নতুন কন্টেন্ট তৈরি করার জন্য (Admin & Artist Combined)
// =========================================================================
router.post(
    "/create", 
    upload.single("featuredImage"), // 🚀 ১. প্রথমে মাল্টার র-ডাটা ও ফাইল প্রসেস করবে
    protect,                        // 🚀 ২. তারপর সিকিউরিটি গার্ড কুকি থেকে টোকেন ভেরিফাই করবে
    (req, res, next) => {
        // 🚀 ৩. ডাবল রোল চেক: ইউজার অ্যাডমিন অথবা আর্টিস্ট কি না
        if (req.user && (req.user.role === "admin" || req.user.role === "artist")) {
            return next();
        }
        return res.status(403).json({ success: false, message: "Access Denied! Only Admins and Artists can upload." });
    },
    createContent                   // 🚀 ৪. সব ভ্যালিডেশন শেষে ফাইনাল কন্ট্রোলার
);

// =========================================================================
// 🛣️ রাউট ৪: কন্টেন্ট এডিট/আপডেট করার জন্য (CRUD - Update)
// 👑 📌 প্রফেশনাল ফিক্স: এখানেও 'upload.single' আগে আনা হয়েছে যেন ইমেজসহ এডিট করা যায়
// =========================================================================
router.put("/:id", upload.single("featuredImage"), protect, updateContent);

// =========================================================================
// 🛣️ রাউট ৫: কন্টেন্ট ডিলিট করার জন্য (CRUD - Delete)
// =========================================================================
router.delete("/:id", protect, deleteContent);

router.get("/artist-assets", protect, getArtistAssets);

// ২. ফাইলের মাঝামাঝি (অবশ্যই ডিলিট/আপডেট রাউটের আশেপাশে) এই পাবলিক রাউটটি যুক্ত করুন
// এটি প্রটেক্টেড নয়, কারণ লগইন ছাড়াও যে কেউ আর্টওয়ার্কের ডিটেইলস দেখতে পারে
router.get("/:id", getSingleArtwork);

export default router;