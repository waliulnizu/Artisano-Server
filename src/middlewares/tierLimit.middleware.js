import mongoose from "mongoose";
import { normalizeTier, uploadsForTier, labelForTier } from "../utils/tier.utils.js";

// =========================================================================
// 🔒 👑 ULTRA-SAFE LIVE DB VERIFICATION & LIMIT GUARD
// =========================================================================

// Creators can live in `users` (JWT accounts) or only in `google_users`
// (better-auth accounts) — never 404 a Google artist just because the local
// collection has no row for them.
const resolveStudioOwner = async (userId) => {
  const User = mongoose.model("User");
  const direct = await User.findById(userId);

  if (direct) {
    return { role: direct.role, tier: normalizeTier(direct.subscriptionTier), name: direct.name };
  }

  const db = mongoose.connection.db;
  if (!db || !mongoose.Types.ObjectId.isValid(String(userId))) return null;

  const googleUser = await db
    .collection("google_users")
    .findOne({ _id: new mongoose.Types.ObjectId(String(userId)) }, { projection: { name: 1, role: 1, subscriptionTier: 1 } });

  if (!googleUser) return null;

  return {
    role: googleUser.role || "user",
    tier: normalizeTier(googleUser.subscriptionTier),
    name: googleUser.name
  };
};

export const checkUploadLimit = async (req, res, next) => {
  try {
    const sessionUser = req.user || req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ success: false, message: "Unauthorized: Please log in again." });
    }

    const userId = sessionUser._id || sessionUser.id;

    const owner = await resolveStudioOwner(userId);

    if (!owner) {
      return res.status(404).json({ success: false, message: "User profile not found in database." });
    }

    // ⚠️ Raw subscription strings ("VIP Premium Pro") are normalised, otherwise a
    //    paying member would be charged against the free-tier upload allowance.
    const userRole = owner.role;
    const tier = owner.tier;

    if (userRole !== "admin" && userRole !== "artist") {
      return res.status(403).json({ 
        success: false, 
        message: "Access Denied! Your current role is not registered as an Artist." 
      });
    }

    if (userRole === "admin") {
      return next();
    }

    const Content = mongoose.model("Content");
    const uploadedCount = await Content.countDocuments({ author: userId });

    // Free 3 · VIP Pro 25 · Studio Enterprise unlimited (storage-backed ceiling).
    const maxLimit = uploadsForTier(tier);
    const unlimited = !Number.isFinite(maxLimit);

    if (!unlimited && uploadedCount >= maxLimit) {
      return res.status(403).json({
        success: false,
        message: `Upload Blocked: your ${labelForTier(tier)} studio allowance is full (${uploadedCount}/${maxLimit} assets). Upgrade your node to publish more! 👑`
      });
    }

    next();
  } catch (error) {
    console.error("Tier Limit Middleware Engine Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error enforcing rate limit constraints." });
  }
};
