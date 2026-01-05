import express, { Router } from "express";
import {
  addDriverRoute,
  deleteDriverRoute,
  getDriver,
  getDriverById,
  onboardDriver,
  searchDriversByRoute,
  toggleDriverStatus,
  updateDriverLocation,
} from "../controllers/driver.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/onboard", protect, onboardDriver);
router.post("/:id/route", addDriverRoute);

router.get("/search-by-route", searchDriversByRoute);
router.get("/me", protect, getDriver);
router.get("/:id", protect, getDriverById);

router.patch("/:id/status", protect, toggleDriverStatus);
router.patch("/:id/location", updateDriverLocation);
router.patch("/:id/route/:routeId", addDriverRoute);
router.delete("/:id/route/:routeId", deleteDriverRoute);

export default router;
