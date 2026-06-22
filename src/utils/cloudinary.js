import { v2 as cloudinary } from "cloudinary"; // 📌 প্রফেশনাল ফিক্স: ক্লাউডিনারির অফিশিয়াল v2 মেথড ইম্পোর্ট
import dotenv from "dotenv";

dotenv.config();

// ক্লাউডিনারি কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==========================================
// 📌 Named Export: uploadOnCloudinary (Professional Method)
// ==========================================
export const uploadOnCloudinary = async (fileBuffer, folderName) => {
  try {
    // সেফটি গার্ড
    if (!fileBuffer) {
      console.error("Cloudinary Error: No file buffer provided");
      return null;
    }

    // বাফার স্ট্রিমিং আপলোড প্রমিজ
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "auto",
          folder: folderName,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Stream Error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // বাফারটিকে স্ট্রিমে পুশ করে শেষ করা
      uploadStream.end(fileBuffer);
    });

    return result; // সফল হলে ক্লাউডিনারির রেসপন্স অবজেক্ট রিটার্ন করবে
  } catch (error) {
    console.error("Cloudinary Upload Error Catch:", error);
    return null;
  }
};