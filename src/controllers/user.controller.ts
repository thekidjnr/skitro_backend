import { Request, Response, NextFunction } from "express";
import { User } from "../models/user.model";
import { createError } from "../utils/error.utils";

// Get current user profile
export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(createError(401, "Not authorized"));

    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found"));

    return res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// Update current user profile
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(createError(401, "Not authorized"));

    const { firstName, lastName, email, role } = req.body;

    const user = await User.findById(userId);
    if (!user) return next(createError(404, "User not found"));

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      data: user,
    });
  } catch (err) {
    next(err);
  }
};

// List all users (optional, for admin)
export const listUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await User.find();
    return res.json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
};
