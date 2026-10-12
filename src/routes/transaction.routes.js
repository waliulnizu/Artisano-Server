import express from "express";
import { getMyTransactionHistory, getMyAcquiredArtworks } from "../controllers/transaction.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/my-history", protect, getMyTransactionHistory);
router.get("/acquired", protect, getMyAcquiredArtworks);

export default router;