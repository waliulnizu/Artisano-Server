import { Content } from "../models/content.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js"; 

// ==========================================
// 📌 ১. Create New Content (Admin Only)
// ==========================================
export const createContent = async (req, res) => {
    try {
        const { title, description, category, isPremiumOnly, resourceLink } = req.body;  

        if (!title || !description || !category) {
            return res.status(400).json({ 
                success: false, 
                message: "Please provide title, description, and category." 
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Artwork image is required!" });
        }

        const fileData = req.file.buffer ? req.file.buffer : req.file.path;
        const cloudinaryResult = await uploadOnCloudinary(fileData, "artisano_contents");
        
        if (!cloudinaryResult) {
            return res.status(500).json({ success: false, message: "Image upload to Cloudinary failed" });
        }

        const newContent = await Content.create({
            title,
            description,
            category,
            isPremiumOnly: isPremiumOnly === 'true' || isPremiumOnly === true, 
            resourceLink,
            featuredImage: cloudinaryResult.secure_url, 
            author: req.user._id 
        });

        res.status(201).json({ success: true, message: "Artwork published successfully!", data: newContent });

    } catch (error) {
        console.error("Create Content Error:", error);
        res.status(500).json({ success: false, message: "Server error creating content" });
    }
};

// ==========================================
// 📌 ২. Get All Content for VIP Dashboard (Fix: Shows Both Free & Premium)
// ==========================================
export const getPremiumContent = async (req, res) => {
    try {
        // 🧠 Developer Thought: আগে এখানে { isPremiumOnly: true } দিয়ে ফিল্টার করা ছিল।
        // যেহেতু আমরা ফ্রি এবং প্রিমিয়াম সব আর্ট এখানে দেখাবো, তাই ফিল্টার অবজেক্টটি সম্পূর্ণ খালি {} করে দিলাম।
        const allData = await Content.find({})
            .sort({ createdAt: -1 }) 
            .populate("author", "name avatar"); 

        res.status(200).json({
            success: true,
            count: allData.length,
            data: allData
        });

    } catch (error) {
        console.error("Get Premium Content Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching content" });
    }
};


export const getPublicContent = async (req, res) => {
    try {
    
        const allData = await Content.find({})
            .sort({ createdAt: -1 }) 
            .populate("author", "name avatar"); 

        res.status(200).json({
            success: true,
            count: allData.length,
            data: allData
        });

    } catch (error) {
        console.error("Get Public Content Error:", error);
        res.status(500).json({ success: false, message: "Server error fetching content" });
    }
};