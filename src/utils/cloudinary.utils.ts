import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export default cloudinary;

export const uploadToCloudinary = async (filePath: string, folder: string) => {
  try {
    const upload = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: "image",
    });

    return {
      url: upload.secure_url,
      public_id: upload.public_id,
    };
  } catch (error) {
    console.error("Cloudinary upload failed:", error);
    throw new Error("Image upload failed");
  }
};
