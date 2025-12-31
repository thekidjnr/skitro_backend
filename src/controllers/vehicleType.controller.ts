import { NextFunction, Request, Response } from "express";
import { createError } from "../utils/error.utils";
import { VehicleType } from "../models/vehicleType.model";

export const createVehicleType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, stickerImage } = req.body;

    if (!name || !stickerImage?.url || !stickerImage?.public_id) {
      return next(createError(400, "Missing required fields"));
    }

    const exists = await VehicleType.findOne({ name });
    if (exists) return next(createError(409, "Bus type already exists"));

    const vehicleType = await VehicleType.create({
      name,
      stickerImage,
    });

    return res.json({
      success: true,
      vehicleType,
    });
  } catch (err) {
    next(err);
  }
};

export const getVehicleTypes = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const vehicleTypes = await VehicleType.find().sort({
      name: 1,
    });

    return res.json({
      success: true,
      vehicleTypes,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleVehicleType = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const vehicleType = await VehicleType.findById(id);
    if (!vehicleType) return next(createError(404, "Bus type not found"));

    vehicleType.active = !vehicleType.active;
    await vehicleType.save();

    return res.json({
      success: true,
      active: vehicleType.active,
    });
  } catch (err) {
    next(err);
  }
};
