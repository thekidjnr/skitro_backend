import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { createError } from "../utils/error.utils";
import { generateToken } from "../utils/jwt.utils";
import { generateOtp, getOtpExpiry } from "../utils/otp.utils";
import { sendSms } from "../utils/sendSMS.utils";
import axios from "axios";

export const startOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { role, phone } = req.body;

    if (!role || !phone) {
      return next(createError(400, "role and phone are required"));
    }

    let user = await User.findOne({ phone });

    if (user) {
      if (!user.role.includes(role)) {
        user.role.push(role);
        await user.save();
      }

      return res.json({
        success: true,
        message: "Onboarding resumed",
        data: user,
      });
    }

    const newUser = new User({
      role: [role],
      phone,
      isPhoneVerified: false,
    });

    await newUser.save();

    return res.json({
      success: true,
      message: "Onboarding started",
      newUser,
    });
  } catch (err) {
    next(err);
  }
};

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phone } = req.body;

    if (!phone) return next(createError(400, "Phone number is required"));

    const user = await User.findOne({ phone });
    if (!user) return next(createError(404, "User not found"));

    const response = await axios.post(
      "https://api.gatekeeperpro.live/api/generate_otp",
      {
        project: process.env.GATEKEEPER_PROJECT_ID,
        phoneNumber: phone,
        size: 6,
        extra: {
          userId: user._id.toString(),
          purpose: "login",
        },
      },
      {
        headers: {
          "X-API-Key": process.env.GATEKEEPER_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    const { reference, expiresAt } = response.data;

    // Store ONLY the reference
    user.otpReference = reference;
    await user.save();

    return res.json({
      success: true,
      message: "OTP sent successfully",
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    next(createError(500, "Failed to send OTP"));
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return next(createError(400, "Phone and OTP are required"));
    }

    const user = await User.findOne({ phone });
    if (!user || !user.otpReference) {
      return next(createError(400, "OTP not requested"));
    }

    console.log("ref", user.otpReference);
    const response = await axios.post(
      "https://api.gatekeeperpro.live/api/verify_otp",
      {
        reference: user.otpReference,
        otp,
      },
      {
        headers: {
          "X-API-Key": process.env.GATEKEEPER_API_KEY!,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.data?.verified) {
      return next(createError(400, "Invalid or expired OTP"));
    }

    // OTP verified
    user.isPhoneVerified = true;
    user.otpReference = undefined;
    await user.save();

    const token = generateToken(user);

    return res.json({
      success: true,
      message: "Phone number verified successfully",
      data: {
        user,
        token,
      },
    });
  } catch (err) {
    console.error(err);
    next(createError(500, "OTP verification failed"));
  }
};

export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user?.id;

    if (!userId) return next(createError(401, "Not authenticated"));
    if (!firstName || !lastName || !email) {
      return next(
        createError(400, "firstName, lastName, and email are required"),
      );
    }

    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found"));

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    await user.save();

    return res.json({
      success: true,
      message: "Profile completed successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};
