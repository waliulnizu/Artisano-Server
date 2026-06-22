import { Content } from "../models/content.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// ==========================================
// 📌 ১. Create New Content (Admin & Artist Combined)
// ==========================================
export const createContent = async (req, res) => {
    try {
        const { title, description, category, isPremiumOnly, resourceLink } = req.body;  

        // ডিফেন্সিভ কন্ডিশনাল চেকিং
        if (!title || !description || !category) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide title, description, and category." 
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Artwork image is required!" });
        }

        // ক্লাউডিনারি আপলোড হ্যান্ডলার (বাফার ও পাথ ফ্রেন্ডলি)
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
            isPremiumOnly: isPremiumOnly === 'true' || isPremiumOnly === true, 
            resourceLink,
            featuredImage: cloudinaryResult.secure_url, 
            author: req.user._id // যে লগইন করা আছে (অ্যাডমিন/আর্টিস্ট) তার আইডি বসবে
        });

        res.status(201).json({ success: true, message: "Artwork published successfully! 🎉", data: newContent });

    } catch (error) {
        console.error("CRITICAL ERROR IN CREATE_CONTENT_CONTROLLER:", error);
        res.status(500).json({ success: false, message: "Server error creating content", error: error.message });
    }
};

// ==========================================
// 📌 ২. Get All Content for VIP Dashboard (Shows Both Free & Premium)
// ==========================================
export const getPremiumContent = async (req, res) => {
    try {
        // 👑 📌 ফিক্স ২: প্রজেক্টের কনসিস্টেন্সি অনুযায়ী 'avatar' পরিবর্তন করে 'profileImage' করা হলো
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

// ==========================================
// 📌 ৩. Get All Content for Public Feed
// ==========================================
export const getPublicContent = async (req, res) => {
    try {
        // 👑 📌 ফিক্স ৩: এখানেও 'avatar' পরিবর্তন করে 'profileImage' করা হলো যেন অথর ইমেজ পারফেক্ট দেখায়
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