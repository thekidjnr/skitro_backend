import { Request, Response, NextFunction } from "express";
import { Driver } from "../models/driver.model";
import { createError } from "../utils/error.utils";

// Admin approves a driver
export const verifyDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return next(createError(400, "Driver ID is required"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return next(createError(404, "Driver not found"));
    }

    if (driver.verified) {
      return next(createError(400, "Driver is already verified"));
    }

    driver.verified = true;
    await driver.save();

    return res.status(200).json({
      success: true,
      message: "Driver verified successfully",
      data: driver,
    });
  } catch (err) {
    next(err);
  }
};

// Admin rejects a driver (optional)
export const rejectDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { driverId } = req.params;

    if (!driverId) {
      return next(createError(400, "Driver ID is required"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return next(createError(404, "Driver not found"));
    }

    driver.verified = false; // explicitly mark as rejected
    await driver.save();

    return res.status(200).json({
      success: true,
      message: "Driver verification rejected",
      data: driver,
    });
  } catch (err) {
    next(err);
  }
};
