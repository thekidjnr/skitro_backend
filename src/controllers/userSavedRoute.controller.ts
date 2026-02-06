import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { UserSavedRoute } from "../models/userSavedRoute.model";

// Save a route
export const saveRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(createError(401, "Not authorized"));

    const { routeTemplateId } = req.body;
    if (!routeTemplateId)
      return next(createError(400, "Route template is required"));

    await UserSavedRoute.findOneAndUpdate(
      { userId, routeTemplateId },
      { userId, routeTemplateId },
      { upsert: true, new: true },
    );

    return res.status(201).json({
      success: true,
      message: "Route saved successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Unsave a route
export const removeSavedRoute = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(createError(401, "Not authorized"));

    const { routeTemplateId } = req.params;

    await UserSavedRoute.findOneAndDelete({
      userId,
      routeTemplateId,
    });

    return res.json({
      success: true,
      message: "Route removed successfully",
    });
  } catch (err) {
    next(err);
  }
};

// Get user's saved routes
export const getSavedRoutes = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return next(createError(401, "Not authorized"));

    const routes = await UserSavedRoute.find({ userId }).populate(
      "routeTemplateId",
    );

    return res.json({
      success: true,
      data: routes,
    });
  } catch (err) {
    next(err);
  }
};
