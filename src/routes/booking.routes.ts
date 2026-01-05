import { Router } from "express";
import {
  createBooking,
  verifyPayment,
} from "../controllers/booking.controller";

const router = Router();

router.post("/", createBooking);
router.post("/verify", verifyPayment);

export default router;
