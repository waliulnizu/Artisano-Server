import express from "express";
import { 
  createContent, 
  getPremiumContent, 
  getPublicContent, 
  updateContent, 
  deleteContent, 
  getArtistAssets, 
  getSingleArtwork,
  uploadStandaloneImage,
  getArtistProfile
} from "../controllers/content.controller.js";
import { protect } from "../middlewares/auth.middleware.js"; 
import { upload } from "../middlewares/multer.middleware.js";
import { checkUploadLimit } from "../middlewares/tierLimit.middleware.js";

const router = express.Router();

// =========================================================================
// =========================================================================
router.get("/public-data", getPublicContent); 

// =========================================================================
// =========================================================================
router.get("/premium-data", protect, (req, res, next) => {
    const isPremium = req.user.isPremium === true;

    if (req.user && (isPremium || req.user.role === "admin")) {
        return next(); 
    }
    return res.status(403).json({ success: false, message: "Premium Access Denied. Upgrade to Pro/Premium room." });
}, getPremiumContent);

// =========================================================================
// =========================================================================
router.post(
    "/create", 
    protect,
    upload.single("featuredImage"),
    checkUploadLimit,
    createContent
);

router.put("/:id", upload.single("featuredImage"), protect, updateContent);

router.delete("/:id", protect, deleteContent);

router.get("/artist-assets", protect, getArtistAssets);

// ⚠️ Must stay above "/:id" — otherwise "artist-profile" would be read as an artwork id.
router.get("/artist-profile", getArtistProfile);

router.get("/:id", getSingleArtwork);

router.post("/upload", protect, upload.single("file"), uploadStandaloneImage);

export default router;