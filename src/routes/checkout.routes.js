import express from "express";
import Stripe from "stripe";

const router = express.Router();

// সিক্রেট কি দিয়ে স্ট্রাইপ ইনিশিয়েট করা
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create a checkout session
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { priceId, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId || "price_H5ggY9M6asL0tZ", 
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/premium`,
      metadata: {
        userId: userId,
      },
    });

    res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Stripe Session Error:", error);
    res.status(500).json({ success: false, message: "Stripe Checkout Failed" });
  }
});

// 👑 মডার্ন নিয়মে এক্সপোর্ট (ফিক্সড)
export default router;