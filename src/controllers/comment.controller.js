import Comment from "../models/comment.model.js";

// =========================================================================
// 📝 ১. নতুন কমেন্ট তৈরি করার লজিক (Create Comment)
// =========================================================================
export const createComment = async (req, res) => {
  try {
    const { artworkId, text } = req.body;
    
    // req.user আসছে আমাদের দারোয়ান (protect middleware) থেকে। 
    // ইউজার লগইন না থাকলে সে কমেন্ট করতে পারবে না।
    const userId = req.user._id; 

    // ডাটাবেসে কমেন্ট ইনসার্ট করা
    const newComment = await Comment.create({
      artworkId,
      user: userId,
      text
    });

    // ফ্রন্টঅ্যান্ডে ইনস্ট্যান্ট দেখানোর জন্য ইউজারের বেসিক ডাটা পপুলেট করে নেওয়া
    const populatedComment = await newComment.populate("user", "name profileImage");

    return res.status(201).json({
      success: true,
      message: "Comment posted successfully! 💬",
      data: populatedComment
    });
  } catch (error) {
    console.error("Create Comment Error:", error);
    return res.status(500).json({ success: false, message: "Server encountered an error posting comment." });
  }
};

// =========================================================================
// 📥 ২. নির্দিষ্ট আর্টওয়ার্কের সব কমেন্ট তুলে আনার লজিক (Get Comments)
// =========================================================================
export const getArtworkComments = async (req, res) => {
  try {
    const { artworkId } = req.params;

    // মঙ্গুজের লেটেস্ট ডকস অনুযায়ী .populate() চেইনিং ব্যবহার করে 
    // কমেন্টকারীর অবজেক্ট থেকে শুধু name এবং profileImage তুলে আনা হলো (পাসওয়ার্ড বা ইমেইল হাইড রাখতে)
    // .sort({ createdAt: -1 }) দেওয়া হয়েছে যেন একদম নতুন কমেন্টটি সবার ওপরে দেখায়।
    const comments = await Comment.find({ artworkId })
      .populate("user", "name profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error("Get Comments Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching comments for this asset." });
  }
};