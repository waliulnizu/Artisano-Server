import mongoose from "mongoose";
import { Content } from "../models/content.model.js";
import { Transaction } from "../models/transaction.model.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// =========================================================================
// =========================================================================
export const createContent = async (req, res) => {
    try {
        const { title, description, category, isPremiumOnly, resourceLink, price } = req.body;  

        if (!title || !description || !category || !price) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide title, description, category, and price." 
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Artwork image is required!" });
        }

        const fileData = req.file.buffer ? req.file.buffer : req.file.path;
        const cloudinaryResult = await uploadOnCloudinary(fileData, "artisano_contents");
        
        if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed" });
        }

        const newContent = await Content.create({
            title,
            description,
            category: category.toLowerCase(),
            price: Number(price),
            isPremiumOnly: isPremiumOnly === 'true' || isPremiumOnly === true, 
            resourceLink,
            featuredImage: cloudinaryResult.secure_url, 
            author: req.user._id 
        });

        res.status(201).json({ success: true, message: "Artwork published successfully! 🎉", data: newContent });

    } catch (error) {
        console.error("CRITICAL ERROR IN CREATE_CONTENT_CONTROLLER:", error);
        res.status(500).json({ success: false, message: "Server error creating content", error: error.message });
    }
};

// =========================================================================
// =========================================================================
export const getPremiumContent = async (req, res) => {
    try {
        const allData = await Content.find({})
            .sort({ createdAt: -1 }) 
            .populate({ path: "author", model: "User", select: "name profileImage" }); 

        res.status(200).json({
            success: true,
            count: allData.length,
            data: allData
        });

    } catch (error) {
        console.error("Get Premium Content Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching premium content" });
    }
};

// =========================================================================
// =========================================================================
export const getPublicContent = async (req, res) => {
    try {
        res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        const { search, category, minPrice, maxPrice, sort, page, limit } = req.query;

        let queryObj = {}; 

        // 🔍 [PERF UPDATE]: $regex O(n) COLLSCAN → $text O(log n) IXSCAN
        if (search) {
            queryObj.$text = { $search: search };
        }

        if (category && category !== "all") {
            queryObj.category = category.toLowerCase();
        }

        if (minPrice || maxPrice) {
            queryObj.price = {};
            if (minPrice) queryObj.price.$gte = Number(minPrice);
            if (maxPrice) queryObj.price.$lte = Number(maxPrice);
        }

        let sortObj = { createdAt: -1 };
        if (sort === "price-low") sortObj = { price: 1 };
        if (sort === "price-high") sortObj = { price: -1 };

        const currentPage = Number(page) || 1;
        const pageLimit = Number(limit) || 8;
        const skipItems = (currentPage - 1) * pageLimit;

        const totalArtworks = await Content.countDocuments(queryObj);
        
        const allData = await Content.find(queryObj)
            .sort(sortObj)
            .skip(skipItems)
            .limit(pageLimit)
            .populate({ path: "author", model: "User", select: "name profileImage" }); 

        res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');

        return res.status(200).json({
            success: true,
            meta: {
                totalItems: totalArtworks,
                totalPages: Math.ceil(totalArtworks / pageLimit),
                currentPage,
                limit: pageLimit,
            },
            data: allData
        });

    } catch (error) {
        console.error("Get Public Content Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching public content" });
    }
};

// =========================================================================
// =========================================================================
export const getArtistAssets = async (req, res) => {
    try {
        const myAssets = await Content.find({ author: req.user._id })
            .sort({ createdAt: -1 })
            .populate({ path: "author", model: "User", select: "name profileImage" });

        res.status(200).json({
            success: true,
            count: myAssets.length,
            data: myAssets
        });
    } catch (error) {
        console.error("Get Artist Assets Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching your assets." });
    }
};

// =========================================================================
// =========================================================================
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, isPremiumOnly, resourceLink, price } = req.body;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    const isAuthor = content.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to edit this content." });
    }

    if (req.file) {
      const fileData = req.file.buffer ? req.file.buffer : req.file.path;
      const cloudinaryResult = await uploadOnCloudinary(fileData, "artisano_contents");
      if (cloudinaryResult && cloudinaryResult.secure_url) {
        content.featuredImage = cloudinaryResult.secure_url;
      }
    }

    content.title = title || content.title;
    content.description = description || content.description;
    content.category = category ? category.toLowerCase() : content.category;
    content.resourceLink = resourceLink || content.resourceLink;
    content.price = price !== undefined ? Number(price) : content.price;
    content.isPremiumOnly = isPremiumOnly !== undefined 
      ? (isPremiumOnly === 'true' || isPremiumOnly === true) 
      : content.isPremiumOnly;

    await content.save();
    return res.status(200).json({ success: true, message: "Content updated successfully! 🎉", data: content });

  } catch (error) {
    console.error("Update Content Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// =========================================================================
// =========================================================================
export const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({ success: false, message: "Content not found." });
    }

    const isAuthor = content.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this content." });
    }

    await Content.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Content deleted successfully! 🗑️" });

  } catch (error) {
    console.error("Delete Content Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

// =========================================================================
// 📌 7. Get Single Artwork Details
// =========================================================================
export const getSingleArtwork = async (req, res) => {
  try {
    const { id } = req.params;

    const artwork = await Content.findById(id).populate({ path: "author", model: "User", select: "name profileImage email" });

    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: "Artwork not found or might have been removed by the creator." 
      });
    }

    // 📊 Social proof: how many collectors already own this edition.
    //    An edition can be owned by unlimited buyers, so this is derived from the
    //    transaction ledger instead of a hard "sold" flag on the artwork itself.
    const collectorCount = await Transaction.countDocuments({
      packageName: `Artwork_Purchase_${artwork._id}`,
      status: "succeeded"
    });

    return res.status(200).json({
      success: true,
      data: { ...artwork.toObject(), collectorCount }
    });
  } catch (error) {
    console.error("Get Single Artwork Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Artwork Secure ID format." });
    }
    return res.status(500).json({ success: false, message: "Server error fetching artwork details." });
  }
};

// =========================================================================
// 📌 8. Upload Standalone Image
// =========================================================================
export const uploadStandaloneImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No image file provided." });
        }
        const fileData = req.file.buffer ? req.file.buffer : req.file.path;
        const cloudinaryResult = await uploadOnCloudinary(fileData, "artisano_avatars");
        
        if (!cloudinaryResult || !cloudinaryResult.secure_url) {
            return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed." });
        }

        return res.status(200).json({ success: true, url: cloudinaryResult.secure_url });
    } catch (error) {
        console.error("Upload Image Error:", error);
        return res.status(500).json({ success: false, message: "Server error during image upload." });
    }
};

// =========================================================================
// 📌 9. Creator dossier — powers the "Dossier" modal on the artwork page
// =========================================================================
export const getArtistProfile = async (req, res) => {
    try {
        const { authorId } = req.query;

        if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({ success: false, message: "A valid creator id is required." });
        }

        // 📚 Catalog size: everything this creator has published.
        const works = await Content.find({ author: authorId }).select("_id").lean();
        const totalArtworks = works.length;

        // 🖼 Acquired works: how many of those editions collectors have secured.
        //    One edition can be acquired by unlimited collectors, so we count the
        //    distinct artworks, not the receipts.
        const acquisitions = totalArtworks
            ? await Transaction.find({
                  status: "succeeded",
                  packageName: { $in: works.map((w) => `Artwork_Purchase_${w._id}`) }
              })
                  .select("packageName user")
                  .lean()
            : [];

        const acquiredWorks = new Set(acquisitions.map((a) => a.packageName)).size;
        const collectors = new Set(acquisitions.map((a) => String(a.user))).size;

        // Creators are either local users or better-auth (Google) users.
        const creator = await User.findById(authorId)
            .select("name email profileImage role createdAt")
            .lean();

        const googleCreator = creator
            ? null
            : await mongoose.connection.db.collection("google_users").findOne(
                  { _id: new mongoose.Types.ObjectId(authorId) },
                  { projection: { name: 1, email: 1, image: 1, createdAt: 1 } }
              );

        const profile =
            creator ||
            (googleCreator && {
                _id: googleCreator._id,
                name: googleCreator.name,
                email: googleCreator.email,
                profileImage: googleCreator.image,
                createdAt: googleCreator.createdAt
            });

        if (!profile) {
            return res.status(404).json({ success: false, message: "Creator profile not found." });
        }

        return res.status(200).json({
            success: true,
            data: {
                _id: String(profile._id),
                name: profile.name || "Verified Artisan",
                email: profile.email || "",
                profileImage: profile.profileImage || "",
                joinedAt: profile.createdAt || null,
                totalArtworks,
                acquiredWorks,
                collectors
            }
        });
    } catch (error) {
        console.error("Artist Profile Error:", error);
        return res.status(500).json({ success: false, message: "Server error fetching creator dossier." });
    }
};