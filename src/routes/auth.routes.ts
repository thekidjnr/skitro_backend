import { Router } from "express";
import {
  completeProfile,
  sendOtp,
  startOnboarding,
  verifyOtp,
} from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Step 1: Start onboarding
router.post("/start", startOnboarding);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/complete-profile", protect, completeProfile);

export default router;
