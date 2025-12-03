import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { RouteTemplate } from "../models/routeTemplate.model";

export const createRouteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to, stops, estimatedDuration, baseFare, distance } = req.body;

    if (!from || !to || !stops || !Array.isArray(stops)) {
      return next(createError(400, "from, to, and stops[] are required"));
    }

    const template = await RouteTemplate.create({
      from,
      to,
      stops,
      estimatedDuration: estimatedDuration || null,
      baseFare: baseFare || 0,
      distance: distance || null,
    });

    return res.status(201).json({
      success: true,
      message: "Route template created successfully",
      data: template,
    });
  } catch (err) {
    next(err);
  }
};

export const getRouteTemplates = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const templates = await RouteTemplate.find();

    return res.status(200).json({
      success: true,
      message: "Route templates fetched successfully",
      data: templates,
    });
  } catch (err) {
    next(err);
  }
};

export const getRouteTemplateById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    console.log(id);
    if (!id) {
      return next(createError(400, "Route template ID is required"));
    }

    const template = await RouteTemplate.findById(id);

    if (!template) {
      return next(createError(404, "Route template not found"));
    }

    return res.status(200).json({
      success: true,
      message: "Route template fetched successfully",
      data: template,
    });
  } catch (err) {
    next(err);
  }
};

export const updateRouteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createError(400, "Route template ID is required"));
    }

    const template = await RouteTemplate.findById(id);
    if (!template) {
      return next(createError(404, "Route template not found"));
    }

    const { from, to, stops, estimatedDuration, baseFare, distance } = req.body;

    if (from) template.from = from;
    if (to) template.to = to;
    if (stops) template.stops = stops;
    if (estimatedDuration) template.estimatedDuration = estimatedDuration;
    if (baseFare !== undefined) template.baseFare = baseFare;
    if (distance) template.distance = distance;

    await template.save();

    return res.status(200).json({
      success: true,
      message: "Route template updated successfully",
      data: template,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteRouteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      return next(createError(400, "Route template ID is required"));
    }

    const template = await RouteTemplate.findById(id);

    if (!template) {
      return next(createError(404, "Route template not found"));
    }

    await template.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Route template deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
