import express from "express";
import { getUser, updateUser, listUsers } from "../controllers/user.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/me", protect, getUser);
router.put("/update", protect, updateUser);
router.get("/", protect, listUsers);

export default router;
