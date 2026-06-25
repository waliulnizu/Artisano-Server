import express from "express";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// =========================================================================
// 💳 ডাইনামিক মক রাউট (Stripe Connection Pipeline Testing)
// =========================================================================
router.post("/buy-artwork/:id", protect, (req, res) => {
    try {
        const artworkId = req.params.id;
        const buyerName = req.user?.name || "Premium User";

        // সাকসেস রেসপন্স নিশ্চিত করা
        return res.status(200).json({
            success: true,
            message: `Pipeline authenticated for ${buyerName}! Ready for Stripe.`,
            id: artworkId
        });
    } catch (error) {
        console.error("Mock Route Server Error:", error);
        return res.status(500).json({ success: false, message: "Internal server error in mock gateway." });
    }
});

export default router;