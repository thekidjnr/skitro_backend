import express, { Router } from "express";
import {
  addDriverRoute,
  deleteDriverRoute,
  onboardDriver,
  toggleDriverStatus,
  updateDriverLocation,
} from "../controllers/driver.controller";
import { protect } from "../middleware/auth.middleware";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.post(
  "/onboard",
  protect,
  upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "licenseImage", maxCount: 1 },
  ]),
  onboardDriver
);
router.patch("/:id/status", protect, toggleDriverStatus);
router.patch("/:id/location", updateDriverLocation);

router.post("/:id/route", addDriverRoute);
router.patch("/:id/route/:routeId", addDriverRoute);
router.delete("/:id/route/:routeId", deleteDriverRoute);

export default router;
