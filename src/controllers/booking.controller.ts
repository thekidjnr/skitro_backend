import { Request, Response, NextFunction } from "express";
import Trip from "../models/trip.model";
import Booking from "../models/booking.model";
import { createError } from "../utils/error.utils";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, tripId, seats } = req.body;

    const trip = await Trip.findById(tripId);
    if (!trip) return next(createError(404, "Trip not found"));

    if (trip.availableSeats < seats)
      return next(createError(400, "Not enough seats available"));

    // Deduct seats
    trip.availableSeats -= seats;
    await trip.save();

    const booking = await Booking.create({
      userId,
      tripId,
      seats,
      amountPaid: seats * trip.price,
    });

    return res.json({
      success: true,
      booking,
    });
  } catch (err) {
    next(err);
  }
};
