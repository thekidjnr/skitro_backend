import { Request, Response, NextFunction } from "express";
import { uploadToCloudinary } from "../utils/cloudinary.utils";
import { createError } from "../utils/error.utils";

export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const file = req.file;
    const folder = req.body.folder || "default";

    if (!file) {
      return next(createError(400, "No file provided"));
    }

    const uploaded = await uploadToCloudinary(file.path, folder);

    return res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: uploaded, // { url, public_id }
    });
  } catch (err) {
    next(err);
  }
};
