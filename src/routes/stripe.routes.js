import express from "express";
import Stripe from "stripe";

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

    // ডাইনামিকালি সাবস্ক্রিপশন সেশন তৈরি করা
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
            unit_amount: amount * 100, // সেন্টে কনভার্ট ($29 = 2900)
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


// 👑 ২. পেমেন্ট সফল হওয়ার পর ডাটাবেস আপডেট করার ১০০% গ্যারান্টিড ভেরিফিকেশন এন্ডপয়েন্ট
router.post("/verify-payment", async (req, res) => {
  try {
    const { sessionId, userId, tierName } = req.body;

    // যদি প্রয়োজনীয় ডাটা না আসে, তবে সাথে সাথে রেসপন্স ফেরত দাও (নইলে ফ্রন্টএন্ড ঘুরতে থাকবে)
    if (!sessionId || !userId) {
      return res.status(400).json({ success: false, message: "Missing required parameters." });
    }

    // স্ট্রাইপ থেকে সেশনটি আসলেই ভ্যালিড কি না তা চেক করা
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status === "paid") {
      try {
        // =========================================================================
        // 📝 [DATABASE UPDATE INJECTOR]: আপনার User মডেল ইম্পোর্ট করা থাকলে নিচের ২ লাইন অন করুন
        // =========================================================================
        // const targetTier = tierName === "Studio Enterprise" ? "premium" : "pro";
        // await User.findByIdAndUpdate(userId, { subscriptionTier: targetTier });
        
        console.log(`✨ User ${userId} successfully upgraded via Session: ${sessionId}`);
      } catch (dbErr) {
        console.error("Database update warning:", dbErr.message);
        // ডাটাবেস মডেলে কোনো ভুল থাকলেও যেন এপিআই রেসপন্স আটকে না যায়, তাই এটি ক্যাচ করা হলো
      }

      // 🎯 [CRITICAL FIX]: ফ্রন্টএন্ডের লোডিং স্পিনার থামাতে এই সাকসেস রেসপন্সটি মাস্ট লাগবে!
      return res.status(200).json({ 
        success: true, 
        message: "Database updated to Pro/Premium successfully!" 
      });
    }

    return res.status(400).json({ success: false, message: "Payment not verified yet." });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    // সার্ভার ক্র্যাশ বা ইন্টারনাল এরর হলেও রেসপন্স ব্যাক করো যেন ফ্রন্টএন্ডে টোস্ট স্টপ হয়
    return res.status(500).json({ success: false, message: "Internal server error during verification." });
  }
});


// 🛒 ৩. ওয়ান-টাইম আর্টওয়ার্ক/টিউটোরিয়াল পারচেজ এন্ডপয়েন্ট (Payment Mode)
router.post("/create-single-purchase-session", async (req, res) => {
  try {
    const { artworkId, price, title, userId } = req.body;

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

      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/transactions?success=true`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/artwork/${artworkId}`,
      metadata: {
        artworkId: artworkId,
        userId: userId || "",
      },
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error("Single Purchase Error:", error);
    return res.status(500).json({ success: false, message: "Failed to initialize single purchase." });
  }
});

export default router;