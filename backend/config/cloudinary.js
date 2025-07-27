// ✅ uploadOnCloudinary.js
import dotenv from "dotenv";
dotenv.config();
import cloudinary from "cloudinary";
import fs from "fs";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (filePath) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.log("Cloudinary not configured, skipping image upload");
      return null;
    }

    const result = await cloudinary.v2.uploader.upload(filePath, {
      resource_type: "auto", // ✅ Support image/audio/video
    });

    fs.unlinkSync(filePath); // ✅ Cleanup temp file
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary error:", error);
    // Clean up file even if upload fails
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw {
      message: "Image upload failed",
      name: "Error",
      http_code: 400
    };
  }
};

export default uploadOnCloudinary;