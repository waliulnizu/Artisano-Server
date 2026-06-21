
export const getPremiumContent = async (req, res) => {
    try {
        // 🧠 Developer Thought: 
        // এই ফাংশনে রিকোয়েস্ট পৌঁছানোর মানেই হলো ইউজার 'protect' এবং 'checkPremium' 
        // দুটো মিডলওয়্যারই সফলভাবে পার হয়ে এসেছে। 
        // তাই আমাদের এখানে আর নতুন করে ইউজারের স্ট্যাটাস চেক করার দরকার নেই।

        // আমরা আপাতত কিছু ডেমো (Mock) প্রিমিয়াম ডাটা পাঠাচ্ছি।
        // ভবিষ্যতে এখানে ডাটাবেস থেকে স্পেশাল কোর্স বা পেইড আর্টিক্যাল ফেচ করা হবে।
        const premiumData = {
            title: "Secret Masterclass: Full-Stack Architecture",
            videoUrl: "https://example.com/premium-video-101",
            author: "Artisano Pro Team"
        };

        // ২০০ (OK) স্ট্যাটাস কোড সহ ডাটা পাঠানো হলো
        res.status(200).json({
            success: true,
            message: "Welcome to the VIP Lounge!",
            data: premiumData
        });

    } catch (error) {
        // যদি ডাটাবেস বা সার্ভারে কোনো অপ্রত্যাশিত সমস্যা হয়
        console.error("Premium Content Error:", error);
        res.status(500).json({ 
            success: false, 
            message: "Failed to load premium content" 
        });
    }
};