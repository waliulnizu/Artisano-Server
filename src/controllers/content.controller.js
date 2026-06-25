import { Content } from "../models/content.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// =========================================================================
// 📌 ১. Create New Content (Admin & Artist Combined)
// =========================================================================
export const createContent = async (req, res) => {
    try {
        // 🚀 UPDATE: req.body থেকে price গ্রহণ করা হলো
        const { title, description, category, isPremiumOnly, resourceLink, price } = req.body;  

        // 🚀 UPDATE: ডিফেন্সিভ চেকে price ফিল্ডটিকেও বাধ্যতামূলক করা হলো
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

        // ডাটাবেসে ডেটা সেভ
        const newContent = await Content.create({
            title,
            description,
            category,
            // 🚀 ADD: ডাটাবেসে সেভ করার সময় নাম্বার ফরম্যাটে কাস্টিং গার্ড দেওয়া হলো
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
// 📌 ২. Get All Content for VIP Dashboard (Shows Both Free & Premium)
// =========================================================================
export const getPremiumContent = async (req, res) => {
    try {
        const allData = await Content.find({})
            .sort({ createdAt: -1 }) 
            .populate("author", "name profileImage"); 

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
// 📌 ৩. Get All Content for Public Feed
// =========================================================================
export const getPublicContent = async (req, res) => {
    try {
        const allData = await Content.find({})
            .sort({ createdAt: -1 }) 
            .populate("author", "name profileImage"); 

        res.status(200).json({
            success: true,
            count: allData.length,
            data: allData
        });

    } catch (error) {
        console.error("Get Public Content Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching public content" });
    }
};

// =========================================================================
// 📌 ৪. Get Only Logged-In Artist's Content (For "My Assets" Page)
// =========================================================================
export const getArtistAssets = async (req, res) => {
    try {
        const myAssets = await Content.find({ author: req.user._id })
            .sort({ createdAt: -1 })
            .populate("author", "name profileImage");

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
// 📌 ৫. Update/Edit Existing Content (CRUD - Update)
// =========================================================================
export const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    // 🚀 UPDATE: বডি থেকে নতুন প্রাইস রিসিভ করা হলো
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

    // ডেটা আপডেট করা
    content.title = title || content.title;
    content.description = description || content.description;
    content.category = category || content.category;
    content.resourceLink = resourceLink || content.resourceLink;
    // 🚀 ADD: কন্টেন্ট এডিট করার সময় দাম বদলানোর লজিক
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
// 📌 ৬. Delete Content (CRUD - Delete)
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
// 🔍 📌 Get Single Artwork Details
// =========================================================================
export const getSingleArtwork = async (req, res) => {
  try {
    const { id } = req.params;

    const artwork = await Content.findById(id).populate("author", "name profileImage");
    
    if (!artwork) {
      return res.status(404).json({ 
        success: false, 
        message: "Artwork not found or might have been removed by the creator." 
      });
    }

    return res.status(200).json({
      success: true,
      data: artwork
    });
  } catch (error) {
    console.error("Get Single Artwork Error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid Artwork Secure ID format." });
    }
    return res.status(500).json({ success: false, message: "Server error fetching artwork details." });
  }
};