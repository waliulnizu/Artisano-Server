import express from "express";
import { toggleWishlist, getMyWishlist } from "../controllers/wishlist.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

// POST http://localhost:5000/api/wishlist/toggle
router.post("/toggle", protect, toggleWishlist);

// =========================================================================
// =========================================================================

router.get("/", protect, getMyWishlist);
router.get("/my-list", protect, getMyWishlist);

export default router;