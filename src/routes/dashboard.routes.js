import express from "express";
import { protect, isArtist, isAdmin } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";
import { Content } from "../models/content.model.js";

const router = express.Router();

// =========================================================================
// 📊 ১. সাধারণ ইউজার/বায়ার অ্যানালিটিক্স (User Dashboard Data)
// =========================================================================
router.get("/user-stats", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        // এখানে পরবর্তীতে রিয়েল পারচেজ অর্ডার কাউন্ট যোগ হবে
        res.status(200).json({
            success: true,
            data: {
                wishlistCount: user.wishlist?.length || 0,
                purchaseCount: 0 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching user metrics." });
    }
});

// =========================================================================
// 🎨 ২. আর্টিস্ট স্টুডিও অ্যানালিটিক্স (Artist Dashboard Data)
// =========================================================================
router.get("/artist-stats", protect, isArtist, async (req, res) => {
    try {
        // এই আর্টিস্টের মোট কয়টি এসেট আপলোড করা আছে তা গোনা
        const totalAssets = await Content.countDocuments({ author: req.user._id });
        
        res.status(200).json({
            success: true,
            data: {
                totalAssets,
                totalSales: 0, // মক সেলস ডাটা (পরবর্তীতে স্ট্রাইপ সিঙ্ক হবে)
                totalEarnings: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching artist studio metrics." });
    }
});

// =========================================================================
// 👑 ৩. সুপার অ্যাডমিন প্যানেল অ্যানালিটিক্স (Admin Dashboard Data)
// =========================================================================
router.get("/admin-stats", protect, isAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalArtworks = await Content.countDocuments();
        const premiumUsers = await User.countDocuments({ isPremium: true });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalArtworks,
                premiumUsers
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching system metrics." });
    }
});

export default router;