import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { Driver } from "../models/driver.model";
import { Booking } from "../models/booking.model";
import axios from "axios";
import mongoose from "mongoose";
import crypto from "crypto";
import { Trip } from "../models/trip.model";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();

  try {
    const {
      userId,
      driverId,
      routeTemplateId,
      departureTime,
      from,
      to,
      fee,
      email,
    } = req.body;

    // 1️⃣ Validate required fields
    if (
      !userId ||
      !driverId ||
      !routeTemplateId ||
      !departureTime ||
      !from ||
      !to ||
      !fee ||
      !email
    ) {
      return next(createError(400, "Missing required fields"));
    }

    // 2️⃣ Parse & validate departureTime
    const parsedDepartureTime = new Date(departureTime);
    if (isNaN(parsedDepartureTime.getTime())) {
      return next(createError(400, "Invalid departureTime"));
    }

    session.startTransaction();

    // 3️⃣ Validate driver exists
    const driver = await Driver.findById(driverId).session(session);
    if (!driver) {
      await session.abortTransaction();
      return next(createError(404, "Driver not found"));
    }

    // 4️⃣ Find existing trip or create one
    const trip = await Trip.findOneAndUpdate(
      { driverId, routeTemplateId, departureTime: parsedDepartureTime },
      {
        $setOnInsert: {
          driverId,
          routeTemplateId,
          departureTime: parsedDepartureTime,
          from,
          to,
          vehicleCapacity: driver.vehicleCapacity,
          seatsBooked: 0,
          status: "scheduled",
        },
      },
      { new: true, upsert: true, session },
    );

    if (!trip) {
      throw new Error("Failed to create or fetch trip");
    }

    // 5️⃣ Guard against already-full trips
    if (trip.seatsBooked >= trip.vehicleCapacity) {
      await session.abortTransaction();
      return next(createError(400, "No seats available"));
    }

    // 6️⃣ Create booking (NO seat confirmation yet)
    const bookingCode = `SK-${Date.now()}-${crypto.randomInt(1000, 9999)}`;

    const booking = await Booking.create(
      [
        {
          userId,
          driverId,
          tripId: trip._id,
          routeTemplateId,
          departureTime: parsedDepartureTime,
          from,
          to,
          vehicleType: driver.vehicleType,
          fee,
          status: "pending",
          paymentStatus: "pending",
          bookingCode,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    // 7️⃣ Initialize Paystack (outside transaction)
    const paystackRes = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(fee * 100),
        reference: bookingCode,
        callback_url: `${process.env.FRONTEND_BASE_URL}/bookings/verify`,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_API_TEST_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.status(201).json({
      success: true,
      bookingId: booking[0]._id,
      tripId: trip._id,
      authorizationUrl: paystackRes.data.data.authorization_url,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const session = await mongoose.startSession();

  try {
    const { reference } = req.query;

    if (!reference) {
      return next(createError(400, "Payment reference is required"));
    }

    // 1️⃣ Verify transaction with Paystack
    const verifyRes = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_API_TEST_KEY}`,
        },
      },
    );

    const paymentData = verifyRes.data?.data;

    if (!paymentData || paymentData.status !== "success") {
      return next(createError(400, "Payment not successful"));
    }

    session.startTransaction();

    // 2️⃣ Fetch booking inside transaction
    const booking = await Booking.findOne({ bookingCode: reference }).session(
      session,
    );

    if (!booking) {
      await session.abortTransaction();
      return next(createError(404, "Booking not found"));
    }

    // 3️⃣ Prevent double processing
    if (booking.paymentStatus === "paid") {
      await session.commitTransaction();
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        booking,
      });
    }

    // 4️⃣ Fetch trip
    const trip = await Trip.findById(booking.tripId).session(session);
    if (!trip) {
      await session.abortTransaction();
      return next(createError(404, "Trip not found"));
    }

    // 5️⃣ Final seat check (VERY IMPORTANT)
    if (trip.seatsBooked >= trip.vehicleCapacity) {
      await session.abortTransaction();
      return next(createError(409, "Trip is full. Payment will be refunded."));
    }

    // 6️⃣ Confirm seat + booking
    trip.seatsBooked += 1;
    booking.paymentStatus = "paid";
    booking.status = "booked";

    await trip.save({ session });
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      message: "Payment verified and seat confirmed",
      booking,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    next(createError(500, "Payment verification failed"));
  }
};

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(createError(400, "Invalid booking ID"));
    }

    const booking = await Booking.findById(id)
      .populate({
        path: "driverId",
        populate: {
          path: "userId",
          select: "firstName lastName email phone",
        },
      })
      .populate("vehicleType")
      .populate({
        path: "routeTemplateId",
        select: "from to stops",
      });

    if (!booking) {
      return next(createError(404, "Booking not found"));
    }

    const route = booking.routeTemplateId as any;

    const findStop = (stopId: any) => {
      if (!route || !stopId) return null;
      if (route.from._id.equals(stopId)) return route.from;
      if (route.to._id.equals(stopId)) return route.to;
      const stopInStops = route.stops.find((s: any) => s._id.equals(stopId));
      return stopInStops || null;
    };

    const enrichedBooking = {
      ...booking.toObject(),
      from: findStop(booking.from),
      to: findStop(booking.to),
    };

    return res.status(200).json({
      success: true,
      booking: enrichedBooking,
    });
  } catch (err) {
    console.error(err);
    next(createError(500, "Failed to fetch booking"));
  }
};

export const getBookingByCode = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { bookingCode } = req.params;

    if (!bookingCode) {
      return next(createError(400, "Booking code is required"));
    }

    const booking = await Booking.findOne({ bookingCode })
      .populate({
        path: "driverId",
        populate: {
          path: "userId",
          select: "firstName lastName email phone",
        },
      })
      .populate("vehicleType")
      .populate({
        path: "routeTemplateId",
        select: "from to stops",
      });

    if (!booking) {
      return next(createError(404, "Booking not found"));
    }

    const route = booking.routeTemplateId as any;

    const findStop = (stopId: any) => {
      if (!route || !stopId) return null;
      if (route.from._id.equals(stopId)) return route.from;
      if (route.to._id.equals(stopId)) return route.to;
      const stopInStops = route.stops.find((s: any) => s._id.equals(stopId));
      return stopInStops || null;
    };

    const enrichedBooking = {
      ...booking.toObject(),
      from: findStop(booking.from),
      to: findStop(booking.to),
    };

    return res.status(200).json({
      success: true,
      booking: enrichedBooking,
    });
  } catch (err) {
    console.error(err);
    next(createError(500, "Failed to fetch booking"));
  }
};

export const getBookingsByUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return next(createError(401, "Unauthorized"));
    }

    const bookings = await Booking.find({ userId })
      .populate({
        path: "driverId",
        populate: {
          path: "userId",
          select: "firstName lastName email phone",
        },
      })
      .populate("vehicleType")
      .populate({
        path: "routeTemplateId",
      })
      .sort({ createdAt: -1 });

    const enrichedBookings = bookings.map((b) => {
      const route = b.routeTemplateId as any;

      if (!route) return b.toObject();

      // Helper to find stop by _id
      const findStop = (stopId: any) => {
        if (!stopId) return null;
        if (route.from._id.equals(stopId)) return route.from;
        if (route.to._id.equals(stopId)) return route.to;
        const stopInStops = route.stops.find((s: any) => s._id.equals(stopId));
        return stopInStops || null;
      };

      return {
        ...b.toObject(),
        from: findStop(b.from),
        to: findStop(b.to),
      };
    });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings: enrichedBookings,
    });
  } catch (err) {
    console.error(err);
    next(createError(500, "Failed to fetch user bookings"));
  }
};
