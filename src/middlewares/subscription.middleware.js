/**
 * @desc    Check if the user has a premium subscription
 * @route   Middleware
 */
export const checkPremium = async (req, res, next) => {
    try {
        // 🧠 Developer Thought: 
        // এই মিডলওয়্যারটি তখনই কল হবে, যখন 'protect' (লগইন চেক) মিডলওয়্যার পার হয়ে আসবে।
        // তাই আমরা নিশ্চিত যে 'req.user' এর ভেতরে ইউজারের ডাটা আছে।

        // ইউজারের সাবস্ক্রিপশন স্ট্যাটাস চেক করা
        if (req.user.subscriptionTier !== 'premium' && req.user.role !== 'admin') {
            
            // 403 Forbidden: এর মানে হলো ইউজার চেনা (লগড ইন), কিন্তু এই ঘরে ঢোকার অনুমতি নেই।
            return res.status(403).json({ 
                success: false, 
                message: "This feature is for Premium users only. Please upgrade your plan." 
            });
        }

        // 🧠 Developer Thought: 
        // যদি ইউজার প্রিমিয়াম হয় বা অ্যাডমিন হয়, তবে ট্রাফিক পুলিশ তাকে যাওয়ার অনুমতি দেবে।
        next(); 

    } catch (error) {
        console.error("Subscription Middleware Error:", error);
        res.status(500).json({ success: false, message: "Server error checking subscription" });
    }
};