import { Router } from "express";
import {
  createBooking,
  verifyPayment,
  getBookingsByUser,
  getBookingById,
  getBookingByCode,
} from "../controllers/booking.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", createBooking);

router.post("/verify", verifyPayment);

router.get("/me", protect, getBookingsByUser);
router.get("/:id", getBookingById);

router.get("/code/:bookingCode", protect, getBookingByCode);

export default router;
