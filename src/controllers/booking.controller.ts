import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { Driver } from "../models/driver.model";
import { Booking } from "../models/booking.model";
import axios from "axios";
import mongoose from "mongoose";
import crypto from "crypto";

export const createBooking = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      userId,
      driverId,
      routeTemplateId,
      date,
      time,
      from,
      to,
      fee,
      email,
    } = req.body;

    if (
      !userId ||
      !driverId ||
      !routeTemplateId ||
      !date ||
      !time ||
      !from ||
      !to ||
      !fee ||
      !email
    ) {
      return next(createError(400, "Missing required fields"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return next(createError(404, "Driver not found"));

    // ✅ ONLY count PAID + BOOKED seats
    const bookedSeats = await Booking.countDocuments({
      driverId,
      routeTemplateId,
      date,
      time,
      status: "booked",
      paymentStatus: "paid",
    });

    if (bookedSeats >= driver.vehicleCapacity) {
      return next(createError(400, "No seats available"));
    }

    const bookingCode = `SK-${Date.now()}-${crypto.randomInt(1000, 9999)}`;

    const booking = new Booking({
      userId: new mongoose.Types.ObjectId(userId),
      driverId: new mongoose.Types.ObjectId(driverId),
      routeTemplateId: new mongoose.Types.ObjectId(routeTemplateId),

      date,
      time,

      from,
      to,
      vehicleType: driver.vehicleType,
      fee,
      status: "pending",
      paymentStatus: "pending",
      bookingCode,
    });

    await booking.save();

    // 2️⃣ Initialize Paystack
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
      }
    );

    // 3️⃣ Return payment URL
    return res.status(201).json({
      success: true,
      authorizationUrl: paystackRes.data.data.authorization_url,
    });
  } catch (err) {
    console.log(err);
    next(err);
  }
};

export const verifyPayment = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
      }
    );

    const paymentData = verifyRes.data?.data;

    if (!paymentData || paymentData.status !== "success") {
      return next(createError(400, "Payment not successful"));
    }

    // 2️⃣ Find booking by bookingCode (same as reference)
    const booking = await Booking.findOne({ bookingCode: reference });

    if (!booking) {
      return next(createError(404, "Booking not found"));
    }

    // 3️⃣ Prevent double processing
    if (booking.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        booking,
      });
    }

    // 4️⃣ Mark booking as PAID + BOOKED
    booking.paymentStatus = "paid";
    booking.status = "booked";

    await booking.save();

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      booking,
    });
  } catch (err) {
    console.error(err);
    next(createError(500, "Payment verification failed"));
  }
};

export const getBookingById = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  next: NextFunction
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
  next: NextFunction
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
