import { Content } from "../models/content.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// =========================================================================
// 📌 ১. Create New Content (Admin & Artist Combined)
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
// 📌 ২. Get All Content for VIP Dashboard (Shows Both Free & Premium)
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
// 👑 📌 ৩. Get All Content for Public Feed (অ্যাডভান্সড সার্চ, ফিল্টার ও পেজিনেশন ইঞ্জিন)
// =========================================================================
export const getPublicContent = async (req, res) => {
    try {
        // 🎯 [BYPASS HEADERS]: ক্রস-অরিজিন এবং প্রি-ফ্লাইট রিকোয়েস্টে Better-Auth-এর ৪০১ জ্যাম এড়াতে এক্সপ্লিসিট হেডার
        res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
        res.header("Access-Control-Allow-Credentials", "true");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

        const { search, category, minPrice, maxPrice, sort, page, limit } = req.query;

        // ডাইনামিক ফিল্টারিং কুয়েরি অবজেক্ট বিল্ড-আপ
        let queryObj = {}; 

        // টাইটেল দিয়ে রেগুলার এক্সপ্রেশন সার্চ (Case-Insensitive)
        if (search) {
            queryObj.title = { $regex: search, $options: "i" };
        }

        // ক্যাটাগরি ফিল্টার
        if (category && category !== "all") {
            queryObj.category = category.toLowerCase();
        }

        // প্রাইস রেঞ্জ ফিল্টার (মিনিমাম ও ম্যাক্সিমাম)
        if (minPrice || maxPrice) {
            queryObj.price = {};
            if (minPrice) queryObj.price.$gte = Number(minPrice);
            if (maxPrice) queryObj.price.$lte = Number(maxPrice);
        }

        // ডাইনামিক সর্টিং ইঞ্জিন (Sorting Logic)
        let sortObj = { createdAt: -1 }; // ডিফল্ট: Newest First
        if (sort === "price-low") sortObj = { price: 1 };   // কম থেকে বেশি দাম
        if (sort === "price-high") sortObj = { price: -1 };  // বেশি থেকে কম দাম

        // কাস্টম পেজিনেশন কন্ট্রোল (Pagination Control)
        const currentPage = Number(page) || 1;
        const pageLimit = Number(limit) || 8; // প্রতি পেজে ৮টি আইটেম রেন্ডার হবে
        const skipItems = (currentPage - 1) * pageLimit;

        // মঙ্গোডিবি কুয়েরি এক্সিকিউশন চেইন
        const totalArtworks = await Content.countDocuments(queryObj);
        
        // 👑 [UPDATE]: পপুলেশন মেকানিজম ক্র্যাশ এড়াতে Explicit Model Reference চেইন বসানো হলো
        const allData = await Content.find(queryObj)
            .sort(sortObj)
            .skip(skipItems)
            .limit(pageLimit)
            .populate({ path: "author", model: "User", select: "name profileImage" }); 

        // 🚀 সরাসরি ডাটা রিটার্ন
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
// 📌 ৪. Get Only Logged-In Artist's Content (For "My Assets" Page)
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
// 📌 ৫. Update/Edit Existing Content (CRUD - Update)
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
// 📌 ৬৬. Delete Content (CRUD - Delete)
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