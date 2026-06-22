import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloudinary = async (fileData, folderName = "artisano_contents") => {
  try {
    if (!fileData) return null;

    // 👑 📌 ফিক্স ১: ফাংশন কল হওয়ার সাথে সাথেই কনফিগারেশন লক করা হলো, যাতে নিচের সব মেথড এটি পায়
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    // 🧠 🛠️ হ্যান্ডলার ১: ডাটা যদি ফাইল বাফার (Buffer) হয়
    if (Buffer.isBuffer(fileData)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folderName, resource_type: "auto" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Buffer Upload Error:", error);
              return reject(error); // প্রমিজ রিজেক্ট
            }
            return resolve(result); // প্রমিজ সাকসেস
          }
        );
        uploadStream.end(fileData);
      });
    }

    // 🧠 🛠️ হ্যান্ডলার ২: ডাটা যদি লোকাল ফাইল পাথ (Disk Path) হয়
    // 📌 ফিক্স ২: ক্লাউডিনারি এখন ওপরের ডাইনামিক কনফিগারেশনটি নির্ভুলভাবে রিড করতে পারবে
    console.log("Processing disk file upload to Cloudinary...");
    const response = await cloudinary.uploader.upload(fileData, {
      folder: folderName,
      resource_type: "auto",
    });

    // লোকাল সার্ভার থেকে আপলোড শেষে ফাইলটি ক্যাশ ক্লিয়ার করতে মুছে ফেলা
    if (typeof fileData === "string" && fs.existsSync(fileData)) {
      fs.unlinkSync(fileData);
    }

    return response;

  } catch (error) {
    console.error("Global Cloudinary Upload Utility Error:", error);
    // এরর আসলেও সার্ভারে ফাইল আটকে থাকলে তা ডিলিট করা
    if (typeof fileData === "string" && fs.existsSync(fileData)) {
      fs.unlinkSync(fileData);
    }
    return null;
  }
};