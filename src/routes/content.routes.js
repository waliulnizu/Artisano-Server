import express from "express";
import { createContent, getPremiumContent } from "../controllers/content.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; 
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// =========================================================================
// 🛣️ রাউট ১: সম্পূর্ণ পাবলিক ফিড (হোমপেজের জন্য - এখানে কোনো প্রিমিয়াম লক গার্ড নেই)
// =========================================================================
router.get("/public-data", protect, getPremiumContent);

// =========================================================================
// 🛣️ রাউট ২: ভিআইপি প্রিমিয়াম গ্যালারি (শুধু প্রো মেম্বারদের জন্য VIP রুম)
// 🧠 Developer Thought: এক্সট্রা ফাইল ইম্পোর্ট না করে সরাসরি এখানেই ইন-লাইন গার্ড বসালাম।
// ইউজার যদি প্রো মেম্বার (isPremium) না হয় এবং অ্যাডমিনও না হয়, তবে তাকে 403 দিয়ে আটকে দেওয়া হবে।
// =========================================================================
router.get("/premium-data", protect, (req, res, next) => {
    if (req.user && (req.user.isPremium || req.user.role === "admin")) {
        return next(); // অ্যাক্সেস অ্যালাউড, কন্ট্রোলারে যাও
    }
    // ফ্রি মেম্বার হলে সরাসরি ৪0৩ এরর ছুড়ে মারো
    return res.status(403).json({ success: false, message: "Premium Access Denied" });
}, getPremiumContent);

// =========================================================================
// 🛣️ রাউট ৩: নতুন কন্টেন্ট তৈরি করার জন্য (অ্যাডমিন অনলি)
// =========================================================================
router.post("/create", protect, upload.single("featuredImage"), createContent);

export default router;