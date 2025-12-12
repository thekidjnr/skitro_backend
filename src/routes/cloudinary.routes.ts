import express from "express";
import multer from "multer";
import { uploadImage } from "../controllers/cloudinary.controller";

const router = express.Router();
const upload = multer({ dest: "tmp/" });

router.post("/upload", upload.single("file"), uploadImage);

export default router;
