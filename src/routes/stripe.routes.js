import express from "express";
import Stripe from "stripe";
import mongoose from "mongoose";
import { Transaction } from "../models/transaction.model.js";
import { Content } from "../models/content.model.js";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import { normalizeTier, slotsForTier, monthlyAcquisitionFilter, nextMonthStart, labelForTier } from "../utils/tier.utils.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { tierName, userId } = req.body; 

    let amount = 29;
    if (tierName === "Studio Enterprise") {
      amount = 99;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tierName || "Artisano VIP Membership Plan",
              description: "Full access to Artisano VIP Pro Room and masterclass vaults.",
            },
            unit_amount: amount * 100,
            recurring: {
              interval: "month", 
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription", 

      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/premium?subscription_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/premium`,
      
      metadata: {
        tierName: tierName,
        userId: userId || "", 
      },
    });

    return res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Stripe Session Error:", error);
    return res.status(500).json({ success: false, message: "Stripe Checkout Engine Failed." });
  }
});

router.post("/verify-payment", async (req, res) => {
  try {
    const { sessionId, userId, tierName } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      try {
        const usersCollection = mongoose.connection.db.collection("users");
        const googleUsersCollection = mongoose.connection.db.collection("google_users");
        let targetId;
        try {
          targetId = new mongoose.Types.ObjectId(userId);
        } catch(e) {
          targetId = userId;
        }

        await usersCollection.updateOne(
          { _id: targetId },
          { $set: { isPremium: true, subscriptionTier: tierName || "pro" } }
        );

        await googleUsersCollection.updateOne(
          { $or: [{ _id: targetId }, { id: userId }] },
          { $set: { isPremium: true, subscriptionTier: tierName || "pro" } }
        );

        console.log(`✨ User ${userId} successfully upgraded via Session: ${sessionId}`);
      } catch (dbErr) {
        console.error("Database update warning:", dbErr.message);
      }

      return res.status(200).json({ 
        success: true, 
        message: "Database updated to Pro/Premium successfully!" 
      });
    }

    return res.status(400).json({ success: false, message: "Payment not verified yet." });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during verification." });
  }
});

router.post("/create-single-purchase-session", protect, async (req, res) => {
  try {
    const { artworkId } = req.body;
    const userId = req.user._id;   // 🔒 identity always comes from the session, never the body

    if (!artworkId) {
      return res.status(400).json({ success: false, message: "Missing artwork reference." });
    }

    // 🔒 Price, title and thumbnail are read from the DB — the client can never dictate the amount.
    const artwork = await Content.findById(artworkId).populate({ path: "author", model: "User", select: "name" });

    if (!artwork) {
      return res.status(404).json({ success: false, message: "Artwork not found or has been archived." });
    }

    if (!artwork.price || artwork.price <= 0) {
      return res.status(400).json({ success: false, message: "This artwork is free and requires no checkout." });
    }

    if (String(artwork.author?._id) === String(userId)) {
      return res.status(403).json({ success: false, message: "Security Block: You cannot purchase your own artwork." });
    }

    // =========================================================================
    // Monthly acquisition quota (Free 3 · VIP Pro 25 · Enterprise unlimited)
    // =========================================================================
    const userTier = normalizeTier(req.user.subscriptionTier); // "free" | "pro" | "premium"
    const maxSlots = slotsForTier(userTier);
    const quotaResetAt = nextMonthStart();

    // Studio Enterprise is uncapped — no ledger round-trip needed at all.
    if (Number.isFinite(maxSlots)) {
      const usedThisMonth = await Transaction.countDocuments(monthlyAcquisitionFilter(userId));

      if (usedThisMonth >= maxSlots) {
        const resetsOn = quotaResetAt.toLocaleDateString("en-US", { month: "long", day: "numeric" });
        return res.status(403).json({
          success: false,
          message: `🚫 Monthly acquisition quota reached (${usedThisMonth}/${maxSlots} on ${labelForTier(userTier)}). Slots refresh on ${resetsOn}, or upgrade your node for more. 👑`
        });
      }
    }

    const APP_URL = process.env.FRONTEND_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: artwork.title,
              description: `by ${artwork.author?.name || "Verified Artisan"} · Artisano original`,
              images: artwork.featuredImage ? [artwork.featuredImage] : [],   // 🖼 thumbnail on the Stripe page
            },
            unit_amount: Math.round(artwork.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",

      success_url: `${APP_URL}/purchase/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/artwork/${artworkId}`,

      metadata: {
        artworkId: String(artwork._id),
        userId: String(userId),
        price: String(artwork.price)
      },
    });

    return res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Single Purchase Guard Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process security parameters for checkout." });
  }
});

router.post("/verify-single-purchase", protect, async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Missing Stripe session reference." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const meta = session.metadata || {};

    // 🔒 The purchased artwork comes from Stripe's own metadata, so a cheap receipt
    //    can never be redeemed for a more expensive masterpiece.
    const artworkId = meta.artworkId;
    const userId = meta.userId || String(req.user._id);

    if (!artworkId) {
      return res.status(400).json({ success: false, message: "This payment session is not linked to any artwork." });
    }

    // 🔒 Receipt ownership: prefer the userId Stripe stored at checkout. Receipts
    //    minted by older builds have an empty userId — those are only claimable by
    //    the collector whose email matches the Stripe receipt, so a leaked session id
    //    can never be redeemed by someone else. The artwork itself is still read from
    //    Stripe's metadata either way.
    const storedOwner = meta.userId ? String(meta.userId) : "";
    const signedInAsOwner = storedOwner === String(req.user._id);
    const receiptEmail = String(session.customer_details?.email || "").trim().toLowerCase();
    const claimerEmail = String(req.user?.email || "").trim().toLowerCase();
    const claimedByMatchingEmail = !storedOwner && !!receiptEmail && receiptEmail === claimerEmail;

    if (!signedInAsOwner && !claimedByMatchingEmail) {
      return res.status(403).json({ success: false, message: "This payment session belongs to another collector." });
    }

    if (session.payment_status === "paid") {
      let transaction = await Transaction.findOne({ transactionId: sessionId });

      if (!transaction) {
        transaction = await Transaction.create({
          transactionId: sessionId,
          user: userId,
          amount: Math.round(session.amount_total / 100),
          currency: "USD",
          status: "succeeded",
          packageName: `Artwork_Purchase_${artworkId}`
        });
        console.log(`✨ Live Database Entry SECURED: Artwork ${artworkId} purchased by User ${userId}`);
      }

      // NOTE: an edition may be owned by unlimited collectors, so `Content.status` stays
      // "available" — the collector count is always derived from the transaction ledger.
      return res.status(200).json({
        success: true,
        artworkId,
        amount: transaction.amount,
        currency: transaction.currency,
        message: "Purchase secured and logged in database!"
      });
    }

    return res.status(400).json({ success: false, message: "Stripe verification pending." });

  } catch (error) {
    console.error("Single Purchase Verification Error:", error);
    return res.status(500).json({ success: false, message: "Internal purchase logger gateway failure." });
  }
});

router.get("/check-ownership", protect, async (req, res) => {
  try {
    const { artworkId } = req.query;
    const userId = req.user._id;   // 🔒 never trust a userId coming from the query string

    if (!artworkId) {
      return res.status(400).json({ success: false, message: "Missing artwork reference." });
    }

    const [hasRecord, collectorCount, tieredUsage] = await Promise.all([
      Transaction.findOne({ user: userId, packageName: `Artwork_Purchase_${artworkId}`, status: "succeeded" }),
      // 📊 How many collectors own this edition (an edition can be owned by unlimited buyers)
      Transaction.countDocuments({ packageName: `Artwork_Purchase_${artworkId}`, status: "succeeded" }),
      // 🗓 Quota is a monthly window, not a lifetime lock-out
      Transaction.countDocuments(monthlyAcquisitionFilter(userId))
    ]);

    const tier = normalizeTier(req.user.subscriptionTier);
    const quotaLimit = slotsForTier(tier);
    const quotaResetAt = nextMonthStart();

    return res.status(200).json({
      success: true,
      hasPurchased: Boolean(hasRecord),
      collectorCount,
      tier,
      tierLabel: labelForTier(tier),
      quotaUsed: tieredUsage,
      quotaLimit,
      quotaUnlimited: !Number.isFinite(quotaLimit),
      quotaResetAt: quotaResetAt.toISOString()
    });

  } catch (error) {
    console.error("Ownership Verification Gate Error:", error);
    return res.status(500).json({ success: false, message: "Internal gate validation failure." });
  }
});

router.get("/admin/sales-analytics", protect, isAdmin, async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const analyticsData = await Transaction.aggregate([
      {
        $match: {
          status: "succeeded",
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalRevenue: { $sum: "$amount" },
          totalSales: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedData = analyticsData.map(item => ({
      date: new Date(item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Revenue: item.totalRevenue,
      Sales: item.totalSales
    }));

    return res.status(200).json({ success: true, data: formattedData });

  } catch (error) {
    console.error("Admin Analytics Error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate charts metrics." });
  }
});

export default router;