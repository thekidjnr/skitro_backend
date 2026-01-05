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

      from: new mongoose.Types.ObjectId(from.id),
      to: new mongoose.Types.ObjectId(to.id),

      vehicleType: new mongoose.Types.ObjectId(driver.vehicleType),
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
    console.log(reference);
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
