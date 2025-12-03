import express, { Router } from "express";
import { onboardDriver } from "../controllers/driver.controller";
import { rejectDriver, verifyDriver } from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.patch("/driver/:driverId/verify", protect, verifyDriver);
router.patch("/driver/:driverId/reject", protect, rejectDriver);

export default router;
