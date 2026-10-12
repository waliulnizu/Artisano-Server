import User from "../models/user.model.js"; 

// =========================================================================
// =========================================================================
export const getAllUsersForAdmin = async (req, res) => {
  try {
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
// =========================================================================
export const updateUserPrivilegeByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isPremium } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User identity not found." });
    }

    if (role !== undefined) {
      if (!["user", "artist", "admin"].includes(role)) {
        return res.status(400).json({ success: false, message: "Invalid role parameter." });
      }
      user.role = role;
    }

    if (isPremium !== undefined) {
      user.isPremium = isPremium;
    }

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