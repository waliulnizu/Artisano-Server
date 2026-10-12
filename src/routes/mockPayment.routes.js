import express from "express";
import { createMockTransaction } from "../controllers/mockPayment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/seed-invoice", protect, createMockTransaction);

export default router;