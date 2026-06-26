import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

// =========================================================================
// 👤 ১. Update Profile Info (Name & Profile Image)
// =========================================================================
export const updateProfileInfo = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;
    const { name, profileImage } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized log in required." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { name, profileImage } },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile settings updated successfully! 👤",
      data: updatedUser
    });
  } catch (error) {
    console.error("UPDATE_PROFILE_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error updating profile details." });
  }
};

// =========================================================================
// 🔒 ২. Update Password (Security Controls)
// =========================================================================
export const updateAccountPassword = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;
    const { oldPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized log in required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // ওল্ড পাসওয়ার্ড ম্যাচিং চেক
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password does not match!" });
    }

    // নতুন পাসওয়ার্ড হ্যাশ করে সেভ করা
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password security updated successfully! 🔒"
    });
  } catch (error) {
    console.error("UPDATE_PASSWORD_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error changing account credentials." });
  }
};