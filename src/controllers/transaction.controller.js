import { Transaction } from "../models/transaction.model.js";

// =========================================================================
// 📌 ১. Get Only Logged-In User's Transaction History
// =========================================================================
export const getMyTransactionHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    const history = await Transaction.find({ user: userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    console.error("GET_TRANSACTION_HISTORY_ERROR:", error);
    return res.status(500).json({ success: false, message: "Server error fetching payment history." });
  }
};