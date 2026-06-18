// ==========================================
// 📌 User Login Controller
// ==========================================
export const loginUser = async (req, res) => {
    try {
        // ১. ফ্রন্টএন্ড থেকে ইমেইল এবং পাসওয়ার্ড রিসিভ করা
        const { email, password } = req.body;

        // ২. ভ্যালিডেশন: ইমেইল বা পাসওয়ার্ড ফাঁকা আছে কি না
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // ৩. ডাটাবেসে ইউজার খোঁজা (এখানে একটি বিশেষ ট্রিক আছে)
        const user = await User.findOne({ email }).select('+password');
        
        // যদি ওই ইমেইলে কোনো ইউজার না থাকে
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // ৪. পাসওয়ার্ড মেলানো (আমাদের বানানো comparePassword মেথড দিয়ে)
        const isMatch = await user.comparePassword(password, user.password);
        
        // পাসওয়ার্ড ভুল হলে
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // ৫. সব ঠিক থাকলে নতুন টোকেন জেনারেট করা
        const token = generateToken(user._id);

        // ৬. টোকেনটি কুকিতে সেট করা
        res.cookie('token', token, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        // ৭. সিকিউরিটির জন্য রেসপন্স থেকে পাসওয়ার্ড মুছে দেওয়া
        user.password = undefined;

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            user,
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ success: false, message: 'Error during login' });
    }
};