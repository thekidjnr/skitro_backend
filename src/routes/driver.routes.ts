import express, { Router } from "express";
import {
  addDriverRoute,
  deleteDriverRoute,
  getDriver,
  onboardDriver,
  searchDriversByRoute,
  toggleDriverStatus,
  updateDriverLocation,
} from "../controllers/driver.controller";
import { protect } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();

router.post("/onboard", protect, onboardDriver);
router.patch("/:id/status", protect, toggleDriverStatus);
router.patch("/:id/location", updateDriverLocation);

router.get("/search-by-route", searchDriversByRoute);
router.get("/me", protect, getDriver);

router.post("/:id/route", addDriverRoute);
router.patch("/:id/route/:routeId", addDriverRoute);
router.delete("/:id/route/:routeId", deleteDriverRoute);

export default router;
