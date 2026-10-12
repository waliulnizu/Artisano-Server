import express from "express";
import { protect, isArtist, isAdmin } from "../middlewares/auth.middleware.js";
import User from "../models/user.model.js";
import { Content } from "../models/content.model.js";
import { Transaction } from "../models/transaction.model.js";
import { normalizeTier, slotsForTier, monthlyAcquisitionFilter, nextMonthStart, labelForTier } from "../utils/tier.utils.js";

const router = express.Router();

// =========================================================================
// =========================================================================
router.get("/user-stats", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");

        // Lifetime ownership — how many masterpieces this collector actually owns.
        const purchaseCount = await Transaction.countDocuments({
            user: req.user._id,
            packageName: { $regex: /^Artwork_Purchase_/ },
            status: "succeeded"
        });

        // Monthly acquisition window — what the quota widget reports.
        const quotaUsed = await Transaction.countDocuments(monthlyAcquisitionFilter(req.user._id));

        const tier = normalizeTier(req.user.subscriptionTier);
        const quotaLimit = slotsForTier(tier);
        const unlimited = !Number.isFinite(quotaLimit);

        res.status(200).json({
            success: true,
            data: {
                wishlistCount: user?.wishlist?.length || 0,
                purchaseCount,
                quotaUsed,
                quotaLimit: unlimited ? null : quotaLimit,
                quotaRemaining: unlimited ? null : Math.max(quotaLimit - quotaUsed, 0),
                quotaUnlimited: unlimited,
                quotaResetAt: nextMonthStart().toISOString(),
                tier,
                tierLabel: labelForTier(tier)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching user metrics." });
    }
});

// =========================================================================
// =========================================================================
router.get("/artist-stats", protect, isArtist, async (req, res) => {
    try {
        const totalAssets = await Content.countDocuments({ author: req.user._id });
        
        res.status(200).json({
            success: true,
            data: {
                totalAssets,
                totalSales: 0,
                totalEarnings: 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching artist studio metrics." });
    }
});

// =========================================================================
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