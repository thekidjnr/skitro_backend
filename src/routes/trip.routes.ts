import { Router } from "express";
import {
  getTripById,
  getTripsForDriver,
  markTripDeparted,
  completeTrip,
  getTripBookings,
} from "../controllers/trip.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.get("/driver/:driverId", protect, getTripsForDriver);
router.get("/:tripId", protect, getTripById);

router.post("/:tripId/depart", protect, markTripDeparted);
router.post("/:tripId/complete", protect, completeTrip);

router.get("/:tripId/bookings", protect, getTripBookings);

export default router;
