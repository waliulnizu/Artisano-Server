import User from '../models/user.model.js';

export const getMe = async (req, res) => {
    res.status(200).json({ success: true, user: req.user });
};

export const updateProfile = async (req, res) => {
    const updatedUser = await User.findByIdAndUpdate(req.user._id, req.body, { new: true }).select("-password");
    res.status(200).json({ success: true, user: updatedUser });
};