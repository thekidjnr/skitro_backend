import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { Driver } from "../models/driver.model";
import { Booking } from "../models/booking.model";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, driverId, routeTemplateId, date, time, from, to, fee } =
      req.body;

    if (
      !userId ||
      !driverId ||
      !routeTemplateId ||
      !date ||
      !time ||
      !from?.id ||
      !to?.id ||
      !fee
    ) {
      return next(createError(400, "Missing required fields"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return next(createError(404, "Driver not found"));

    const bookedCount = await Booking.countDocuments({
      driverId,
      routeTemplateId,
      date,
      time,
      status: "booked",
    });

    if (bookedCount >= (driver.seatsAvailable || 0)) {
      return next(createError(400, "No seats available"));
    }

    const booking = await Booking.create({
      userId,
      driverId,
      routeTemplateId,
      date,
      time,
      from,
      to,
      vehicleType: driver.vehicleType.toString(),
      fee,
      bookingCode: `SK-${Date.now()}`,
    });

    return res.status(201).json({
      success: true,
      booking,
    });
  } catch (err) {
    next(err);
  }
};
