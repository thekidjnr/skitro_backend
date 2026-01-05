import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { RouteTemplate } from "../models/routeTemplate.model";
import { GeoPoint, haversine, haversinePoints } from "../utils/haversine.utils";

export const createRouteTemplate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { from, to, stops, pricePerKm = 2 } = req.body;

    if (!from || !to || !stops || !Array.isArray(stops)) {
      return next(createError(400, "from, to, and stops[] are required"));
    }

    // Combine from, stops, to into one array for easier distance calculation
    const allStops = [from, ...stops, to];

    const stopDistances: number[] = [];
    for (let i = 0; i < allStops.length - 1; i++) {
      const a = allStops[i];
      const b = allStops[i + 1];

      if (!a.lat || !a.lng || !b.lat || !b.lng) {
        return next(createError(400, "Each stop must include lat & lng"));
      }

      const dist = haversine(a.lat, a.lng, b.lat, b.lng);
      stopDistances.push(Number(dist.toFixed(2)));
    }

    const totalDistance = stopDistances.reduce((a, b) => a + b, 0);

    // Calculate baseFare based on total distance and pricePerKm
    const baseFare = Number((totalDistance * pricePerKm).toFixed(2));

    const template = await RouteTemplate.create({
      from,
      to,
      stops,
      stopDistances,
      pricePerKm,
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

export const estimateRouteFare = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; // routeTemplate ID
    const { fromStopId, toStopId } = req.body;

    if (!fromStopId || !toStopId) {
      return next(createError(400, "fromStopId and toStopId are required"));
    }

    const routeTemplate = await RouteTemplate.findById(id);
    if (!routeTemplate) {
      return next(createError(404, "Route template not found"));
    }

    // Find the fromStop
    const fromStop: GeoPoint | undefined =
      routeTemplate.from._id.toString() === fromStopId
        ? routeTemplate.from
        : routeTemplate.stops.find((s) => s._id.toString() === fromStopId);

    // Find the toStop
    const toStop: GeoPoint | undefined =
      routeTemplate.to._id.toString() === toStopId
        ? routeTemplate.to
        : routeTemplate.stops.find((s) => s._id.toString() === toStopId);

    if (!fromStop || !toStop) {
      return next(createError(400, "Invalid stop selection"));
    }

    // Ensure from comes before to in the route order
    const allStops = [
      routeTemplate.from,
      ...routeTemplate.stops,
      routeTemplate.to,
    ];
    const fromIndex = allStops.findIndex(
      (s) => s._id.toString() === fromStopId
    );
    const toIndex = allStops.findIndex((s) => s._id.toString() === toStopId);

    if (fromIndex >= toIndex) {
      return next(createError(400, "`from` stop must come before `to` stop"));
    }

    // Calculate straight-line distance
    const distanceKm = haversinePoints(fromStop, toStop);

    if (typeof routeTemplate.pricePerKm !== "number") {
      return next(
        createError(400, "pricePerKm is not configured for this route")
      );
    }

    const fare = Number((distanceKm * routeTemplate.pricePerKm).toFixed(2));

    return res.json({
      success: true,
      data: {
        routeTemplateId: id,
        fromStopId,
        toStopId,
        distanceKm: Number(distanceKm.toFixed(2)),
        pricePerKm: routeTemplate.pricePerKm,
        fare,
      },
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

    const template = await RouteTemplate.findById(id);
    if (!template) return next(createError(404, "Route template not found"));

    const { from, to, stops, baseFare, pricePerKm } = req.body;

    if (from) template.from = from;
    if (to) template.to = to;

    if (stops) {
      template.stops = stops;

      const stopDistances: number[] = [];

      for (let i = 0; i < stops.length - 1; i++) {
        const a = stops[i];
        const b = stops[i + 1];

        if (!a.lat || !a.lng || !b.lat || !b.lng) {
          return next(createError(400, "Each stop must include lat & lng"));
        }

        const dist = haversine(a.lat, a.lng, b.lat, b.lng);
        stopDistances.push(Number(dist.toFixed(2)));
      }

      template.stopDistances = stopDistances;
    }

    if (pricePerKm !== undefined) template.pricePerKm = pricePerKm;

    await template.save();

    return res.json({
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
