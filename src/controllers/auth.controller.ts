import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { createError } from "../utils/error.utils";
import { generateToken } from "../utils/jwt.utils";

export const startOnboarding = async (
  req: Request,
  res: Response,
  next: NextFunction
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
      role,
      phone,
      isPhoneVerified: false,
      onboardingComplete: false,
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

const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

export const sendOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone } = req.body;

    if (!phone) return next(createError(400, "Phone number is required"));

    const user = await User.findOne({ phone });
    if (!user) return next(createError(404, "User not found"));

    const otp = generateOtp();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // TODO: Integrate SMS service here
    console.log(`OTP for ${phone}: ${otp}`);

    return res.json({
      success: true,
      otp,
      message: "OTP sent successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return next(createError(400, "Phone and OTP are required"));
    }

    const user = await User.findOne({ phone });
    if (!user) return next(createError(404, "User not found"));

    if (!user.otp || !user.otpExpiresAt) {
      return next(createError(400, "OTP not requested or expired"));
    }

    if (user.otpExpiresAt < new Date()) {
      return next(createError(400, "OTP has expired"));
    }

    if (user.otp !== otp) {
      return next(createError(400, "Invalid OTP"));
    }

    // OTP verified → update user
    user.isPhoneVerified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Generate JWT here
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
    next(err);
  }
};

export const completeProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { firstName, lastName, email } = req.body;
    const userId = req.user?.id;

    if (!userId) return next(createError(401, "Not authenticated"));
    if (!firstName || !lastName || !email) {
      return next(
        createError(400, "firstName, lastName, and email are required")
      );
    }

    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found"));

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.onboardingComplete = true;

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
