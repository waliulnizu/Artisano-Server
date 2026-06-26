// 🎯 আপনার প্রোজেক্টের এক্সিস্টিং ইউজার মডেল (কার্লি ব্রেসেস ছাড়া সরাসরি default export রিড করা হচ্ছে)
import User from "../models/user.model.js"; 

// =========================================================================
// 👥 ১. Get All Users List for Admin (ফ্রন্টএন্ডের প্রথম এপিআই কলের সাথে সিঙ্কড)
// =========================================================================
export const getAllUsersForAdmin = async (req, res) => {
  try {
    // ডাটাবেস থেকে পাসওয়ার্ড বাদে সব ইউজার লেটেস্ট ডেট অনুযায়ী তুলে আনা
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    
    return res.status(200).json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    console.error("ADMIN_GET_USERS_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error fetching user directory." });
  }
};

// =========================================================================
// 🔄 ২. Update User Role or Premium Status (ফ্রন্টএন্ডের handleUserUpdate এর সাথে সিঙ্কড)
// =========================================================================
export const updateUserPrivilegeByAdmin = async (req, res) => {
  try {
    const { id } = req.params; // ফ্রন্টএন্ড ইউআরএল থেকে userId নিবে
    const { role, isPremium } = req.body; // ফ্রন্টএন্ড থেকে পাঠানো অবজেক্ট ডেস্ট্রাকচারিং

    // ডাটাবেসে ইউজার খুঁজে বের করা
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User identity not found." });
    }

    // ফ্রন্টএন্ড যদি রোল পাঠায় তবে রোল আপডেট হবে
    if (role !== undefined) {
      if (!["user", "artist", "admin"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role parameter." });
      }
      user.role = role;
    }

    // ফ্রন্টএন্ড যদি প্রিমিয়াম স্ট্যাটাস (true/false) পাঠায় তবে সেটি আপডেট হবে
    if (isPremium !== undefined) {
      user.isPremium = isPremium;
    }

    // সেভ করা
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User controls updated successfully! 🛠️"
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error updating user privilege." });
  }
};