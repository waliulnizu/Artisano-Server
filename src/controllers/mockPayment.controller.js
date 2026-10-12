import { Transaction } from "../models/transaction.model.js";
import crypto from "crypto";

// =========================================================================
// 🧪 MOCK TRANSACTION INJECTOR ENGINE (FOR LIVE TESTING)
// =========================================================================
export const createMockTransaction = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized log in required." });
    }

    const mockPackages = [
      { name: "Pro VIP Membership Room", amount: 29.99 },
      { name: "Premium Brush Kit v4.2", amount: 15.00 },
      { name: "Masterclass Oil Painting Tutorial", amount: 49.00 }
    ];

    const randomPackage = mockPackages[Math.floor(Math.random() * mockPackages.length)];
    const mockTxId = `ch_${crypto.randomBytes(12).toString("hex")}`;

    const newTx = await Transaction.create({
      transactionId: mockTxId,
      user: userId,
      amount: randomPackage.amount,
      packageName: randomPackage.name,
      status: "succeeded"
    });

    return res.status(201).json({
      success: true,
      message: `Success! Generated invoice for: ${randomPackage.name} 🎉`,
      data: newTx
    });
  } catch (error) {
    console.error("MOCK_PAYMENT_GENERATOR_ERROR:", error);
    return res.status(500).json({ success: false, message: "Internal server error seeding payment tokens." });
  }
};