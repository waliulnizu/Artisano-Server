/**
 * @desc    Check if the user has a premium subscription
 * @route   Middleware
 */
export const checkPremium = async (req, res, next) => {
    try {
        // 🧠 Developer Thought: 

        if (req.user.subscriptionTier !== 'premium' && req.user.role !== 'admin') {
            
            return res.status(403).json({ 
                success: false, 
                message: "This feature is for Premium users only. Please upgrade your plan." 
            });
        }

        // 🧠 Developer Thought: 
        next(); 

    } catch (error) {
        console.error("Subscription Middleware Error:", error);
        res.status(500).json({ success: false, message: "Server error checking subscription" });
    }
};