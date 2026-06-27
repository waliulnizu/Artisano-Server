import express from "express";
import Stripe from "stripe";
import { Transaction } from "../models/transaction.model.js"; // আপনার ফোল্ডার অনুযায়ী পাথটি মিলিয়ে নেবেন

const router = express.Router();

// 🔒 ড্যাশবোর্ড থেকে পাওয়া সিক্রেট কি দিয়ে স্ট্রাইপ ইনিশিয়েট করা
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🚀 ১. প্রিমিয়াম মেম্বারশিপ চেকআউট এন্ডপয়েন্ট (Subscription Mode)
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { tierName, userId } = req.body; 

    let amount = 29; // VIP Premium Pro এর জন্য $29
    if (tierName === "Studio Enterprise") {
      amount = 99; // Studio Enterprise এর জন্য $99
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
            unit_amount: amount * 100, // সেন্টে কনভার্ট
            recurring: {
              interval: "month", 
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription", 

      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
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


// 👑 ২. পেমেন্ট সফল হওয়ার পর মেম্বারশিপ ডাটাবেস আপডেট করার ভেরিফিকেশন এন্ডপয়েন্ট
router.post("/verify-payment", async (req, res) => {
  try {
    const { sessionId, userId, tierName } = req.body;

    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      try {
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



// 🛒 ৩. ওয়ান-টাইম আর্টওয়ার্ক পারচেজ এন্ডপয়েন্ট (With Tier Limit Guard 🛡️)
router.post("/create-single-purchase-session", async (req, res) => {
  try {
    const { artworkId, price, title, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "Authentication required to purchase assets." });
    }

    // =========================================================================
    // 🛡️ [TIER LIMIT GUARD]: ইউজারের অলরেডি কেনা টোটাল আর্টওয়ার্কের সংখ্যা গণনা করা
    // =========================================================================
    const totalPurchasedArtworks = await Transaction.countDocuments({
      user: userId,
      packageName: { $regex: /^Artwork_Purchase_/ }, // শুধু আর্টওয়ার্ক পারচেজের রেকর্ডগুলো গোনা হবে
      status: "succeeded"
    });

    // 🎯 ইউজারের কারেন্ট সাবস্ক্রিপশন টিয়ার ডাটাবেস থেকে রিড করা (ফলব্যাক হিসেবে "free" ধরা হলো)
    // দ্রষ্টব্য: আপনার প্রোফাইলে যদি subscriptionTier ফিল্ড অন্য নামে থাকে, তবে সেভাবে মিলাবেন
    let userTier = "free"; 
    try {
      const userProfile = await mongoose.model("User").findById(userId);
      if (userProfile && userProfile.subscriptionTier) {
        userTier = userProfile.subscriptionTier.toLowerCase(); // "free", "pro", "premium"
      }
    } catch (err) {
      console.log("User profile fetch fallback within limit guard.");
    }

    // ❌ লিমিট চেকিং কন্ডিশনাল লজিক
    if (userTier === "free" && totalPurchasedArtworks >= 3) {
      return res.status(403).json({
        success: false,
        message: "🚫 Purchase Limit Reached: Free users can secure up to 3 artworks. Please upgrade to VIP Pro room to unlock more slots! 👑"
      });
    }

    if (userTier === "pro" && totalPurchasedArtworks >= 9) {
      return res.status(403).json({
        success: false,
        message: "🚫 Purchase Limit Reached: VIP Pro users can secure up to 9 artworks. Upgrade to Studio Enterprise for unlimited workspace! 🚀"
      });
    }

    // =========================================================================
    // 💳 লিমিট পাস করলে তবেই স্ট্রাইপ সেশন তৈরি হবে
    // =========================================================================
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: title || "Artisano Premium Asset",
            },
            unit_amount: Math.round(price * 100), 
          },
          quantity: 1,
        },
      ],
      mode: "payment", 

      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/artwork/${artworkId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/artwork/${artworkId}`,
      
      metadata: {
        artworkId: artworkId,
        userId: userId || "",
        price: price.toString()
      },
    });

    return res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Single Purchase Guard Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process security parameters for checkout." });
  }
});


// 👑 ৪. সিঙ্গেল পারচেজ সাকসেস হওয়ার পর আপনার ওন-মডেল ট্রানজেকশন টেবিলে সেভ করার লাইভ এন্ডপয়েন্ট
router.post("/verify-single-purchase", async (req, res) => {
  try {
    const { sessionId, userId, artworkId } = req.body;

    if (!sessionId || !userId || !artworkId) {
      return res.status(400).json({ success: false, message: "Missing required tracking parameters." });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      // ডুপ্লিকেট এন্ট্রি প্রটেকশন
      const existingTx = await Transaction.findOne({ transactionId: sessionId });
      
      if (!existingTx) {
        // আপনার অবজেক্ট মডেল স্ট্রাকচার অনুযায়ী ডাটাবেস এন্ট্রি হচ্ছে
        const newTransaction = new Transaction({
          transactionId: sessionId,
          user: userId, 
          amount: Math.round(session.amount_total / 100), // সেন্ট থেকে ডলারে কনভার্ট
          currency: "USD",
          status: "succeeded",
          packageName: `Artwork_Purchase_${artworkId}` // ওনারশিপ ট্র্যাকিং ফ্ল্যাগ
        });

        await newTransaction.save();
        console.log(`✨ Live Database Entry SECURED: Artwork ${artworkId} purchased by User ${userId}`);
      }

      return res.status(200).json({ success: true, message: "Purchase secured and logged in database!" });
    }

    return res.status(400).json({ success: false, message: "Stripe verification pending." });

  } catch (error) {
    console.error("Single Purchase Verification Error:", error);
    return res.status(500).json({ success: false, message: "Internal purchase logger gateway failure." });
  }
});


// 👑 ৫. CHALLENGE ENGINE: ওনারশিপ ভেরিফিকেশন গেটওয়ে (ডাটাবেস ট্র্যাকিং লাইভ সিঙ্ক)
router.get("/check-ownership", async (req, res) => {
  try {
    const { userId, artworkId } = req.query;

    if (!userId || !artworkId) {
      return res.status(400).json({ success: false, message: "Missing query parameters." });
    }

    // আপনার নিজস্ব মঙ্গোডিবি মডেলে কুয়েরি করে চেক করা হচ্ছে রেকর্ড আছে কি না
    const hasRecord = await Transaction.findOne({
      user: userId,
      packageName: `Artwork_Purchase_${artworkId}`,
      status: "succeeded"
    });

    if (hasRecord) {
      return res.status(200).json({ success: true, hasPurchased: true });
    }

    return res.status(200).json({ success: true, hasPurchased: false });

  } catch (error) {
    console.error("Ownership Verification Gate Error:", error);
    return res.status(500).json({ success: false, message: "Internal gate validation failure." });
  }
});

// 📊 ৬. ADMIN ANALYTICS: চার্টের জন্য সেলস ও রেভিনিউ ডাটা প্রসেসিং এন্ডপয়েন্ট
router.get("/admin/sales-analytics", async (req, res) => {
  try {
    // গত ৭ দিনের ডেটা ফিল্টার করার জন্য ডেট ক্যালকুলেশন
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
          totalRevenue: { $sum: "$amount" }, // মোট আয়
          totalSales: { $sum: 1 } // মোট কয়টি সেল হয়েছে
        }
      },
      { $sort: { _id: 1 } } // তারিখ অনুযায়ী সাজানো (Oldest to Newest)
    ]);

    // ফ্রন্টএন্ড চার্টের রিডাবল ফরম্যাটে কনভার্ট করা
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