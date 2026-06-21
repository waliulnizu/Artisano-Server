import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// ক্লাউডিনারি কনফিগারেশন
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (fileBuffer, folderName) => {
  try {
    // 📌 সেফটি গার্ড: যদি ফাইল বাফার না থাকে, তবে সার্ভার ক্র্যাশ না করে null রিটার্ন করবে
    if (!fileBuffer) {
      console.error("Cloudinary Error: No file buffer provided");
      return null;
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          // 'image' এর বদলে 'auto' দিলে এটি আরও ফ্লেক্সিবল হয় (ভবিষ্যতে ভিডিও বা পিডিএফ আপলোড করতে চাইলে কাজে দেবে)
          resource_type: 'auto', 
          folder: folderName
        }, 
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // বাফারটিকে স্ট্রিমে পুশ করা হচ্ছে
      uploadStream.end(fileBuffer);
    });
    
    return result;
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    return null;
  }
};