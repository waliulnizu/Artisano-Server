import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCloudinary = async (fileData, folderName = "artisano_contents") => {
  try {
    if (!fileData) return null;

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    if (Buffer.isBuffer(fileData)) {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: folderName, resource_type: "auto" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary Buffer Upload Error:", error);
              return reject(error);
            }
            return resolve(result);
          }
        );
        uploadStream.end(fileData);
      });
    }

    console.log("Processing disk file upload to Cloudinary...");
    const response = await cloudinary.uploader.upload(fileData, {
      folder: folderName,
      resource_type: "auto",
    });

    if (typeof fileData === "string" && fs.existsSync(fileData)) {
      fs.unlinkSync(fileData);
    }

    return response;

  } catch (error) {
    console.error("Global Cloudinary Upload Utility Error:", error);
    if (typeof fileData === "string" && fs.existsSync(fileData)) {
      fs.unlinkSync(fileData);
    }
    return null;
  }
};