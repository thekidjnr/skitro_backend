import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { createError } from "../utils/error.utils";
import { Trip } from "../models/trip.model";
import { Booking } from "../models/booking.model";

// ─────────────────────────────
// Get single trip by ID
// ─────────────────────────────
export const getTripById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return next(createError(400, "Invalid trip ID"));
    }

    const trip = await Trip.findById(tripId)
      .populate("driverId", "vehicleRegNumber vehicleType")
      .populate("routeTemplateId");

    if (!trip) return next(createError(404, "Trip not found"));

    return res.status(200).json({
      success: true,
      trip,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────
// Get all trips for a driver on a given date
// ─────────────────────────────
export const getTripsForDriver = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { driverId } = req.params;
    const { date } = req.query;

    if (!date || typeof date !== "string") {
      return next(createError(400, "Date is required"));
    }

    // Convert date to start & end of day for departureTime query
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);

    const trips = await Trip.find({
      driverId: new mongoose.Types.ObjectId(driverId),
      departureTime: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: "cancelled" },
    }).sort({ departureTime: 1 });

    return res.status(200).json({
      success: true,
      count: trips.length,
      trips,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────
// Mark trip as departed
// ─────────────────────────────
export const markTripDeparted = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) return next(createError(404, "Trip not found"));

    if (trip.status !== "scheduled") {
      return next(
        createError(400, "Only scheduled trips can be marked as departed"),
      );
    }

    trip.status = "departed";
    await trip.save();

    return res.status(200).json({
      success: true,
      message: "Trip marked as departed",
      trip,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────
// Complete trip
// ─────────────────────────────
export const completeTrip = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;

    const trip = await Trip.findById(tripId);
    if (!trip) return next(createError(404, "Trip not found"));

    if (trip.status !== "departed") {
      return next(createError(400, "Only departed trips can be completed"));
    }

    trip.status = "completed";
    await trip.save();

    return res.status(200).json({
      success: true,
      message: "Trip completed successfully",
      trip,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────
// Get all passengers (bookings) for a trip
// ─────────────────────────────
export const getTripBookings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { tripId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tripId)) {
      return next(createError(400, "Invalid trip ID"));
    }

    // Ensure trip exists
    const trip = await Trip.findById(tripId);
    if (!trip) return next(createError(404, "Trip not found"));

    // Fetch valid passengers
    const bookings = await Booking.find({
      tripId: new mongoose.Types.ObjectId(tripId),
      status: "booked",
      paymentStatus: "paid",
    })
      .populate("userId", "name phone email") // adjust fields as needed
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      trip: {
        id: trip._id,
        departureTime: trip.departureTime,
        from: trip.from,
        to: trip.to,
        seatsBooked: trip.seatsBooked,
        vehicleCapacity: trip.vehicleCapacity,
      },
      passengers: bookings.map((b) => ({
        bookingId: b._id,
        bookingCode: b.bookingCode,
        user: b.userId,
      })),
    });
  } catch (err) {
    next(err);
  }
};
