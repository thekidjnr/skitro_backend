import express, { Router } from "express";
import {
  addDriverRoute,
  deleteDriverRoute,
  getDriver,
  onboardDriver,
  toggleDriverStatus,
  updateDriverLocation,
} from "../controllers/driver.controller";
import { protect } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();

router.post("/onboard", protect, onboardDriver);
router.patch("/:id/status", protect, toggleDriverStatus);
router.patch("/:id/location", updateDriverLocation);

router.get("/:id", getDriver);

router.post("/:id/route", addDriverRoute);
router.patch("/:id/route/:routeId", addDriverRoute);
router.delete("/:id/route/:routeId", deleteDriverRoute);

export default router;
