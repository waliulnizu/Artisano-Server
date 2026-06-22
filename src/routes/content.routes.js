import express from "express";
import { createContent, getPremiumContent } from "../controllers/content.controller.js";
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
// 👑 📌 প্রফেশনাল ফিক্স: 'upload.single' কে 'protect' এর আগে আনা হলো 
// 🧠 Developer Thought: মাল্টার আগে বডি ও ফাইল প্রসেস করবে, তারপর 'protect' মিডলওয়্যার কুকি রিড করতে পারবে।
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

export default router;