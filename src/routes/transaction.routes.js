import express from "express";
import { getMyTransactionHistory } from "../controllers/transaction.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// 🛣️ মেইন ডাইনামিক হিস্ট্রি নোড
router.get("/my-history", protect, getMyTransactionHistory);

export default router;