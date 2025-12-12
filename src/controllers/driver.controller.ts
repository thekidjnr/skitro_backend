import { Request, Response, NextFunction } from "express";
import { Driver } from "../models/driver.model";
import { createError } from "../utils/error.utils";
import { RouteTemplate } from "../models/routeTemplate.model";

export const onboardDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      userId,
      vehicleRegNumber,
      vehicleType,
      vehicleCapacity,
      vehicleImage,
      licenseImage,
      routes,
    } = req.body;

    // 1. Required fields validation
    if (
      !userId ||
      !vehicleRegNumber ||
      !vehicleType ||
      !licenseImage ||
      !routes ||
      !Array.isArray(routes) ||
      routes.length === 0
    ) {
      return next(createError(400, "Missing required onboarding fields"));
    }

    // 2. Check if driver already exists
    const existingDriver = await Driver.findOne({ userId });
    if (existingDriver) {
      return next(createError(400, "Driver already onboarded"));
    }

    // 3. Validate route templates
    const validatedRoutes = [];
    for (const r of routes) {
      const template = await RouteTemplate.findById(r.routeTemplateId);
      if (!template)
        return next(
          createError(404, `Route template not found: ${r.routeTemplateId}`)
        );

      validatedRoutes.push({
        routeTemplateId: r.routeTemplateId,
        from: template.from, // auto fill
        to: template.to, // auto fill
        selectedStops:
          r.selectedStops?.map((stopName: string) => {
            const stop = template.stops.find((s) => s.name === stopName);
            return stop || { name: stopName, lat: 0, lng: 0 }; // fallback
          }) || template.stops,
        times: r.times.map((t: string) => ({ time: t, enabled: true })), // convert strings to objects
        active: false,
      });
    }

    // 4. Create driver entry
    const driver = await Driver.create({
      userId,
      vehicleRegNumber,
      vehicleType,
      vehicleCapacity: vehicleCapacity || 15,
      seatsAvailable: vehicleCapacity || 15,

      vehicleImage: {
        url: vehicleImage?.url || null,
        public_id: vehicleImage?.public_id || null,
      },

      licenseImage: {
        url: licenseImage.url,
        public_id: licenseImage.public_id,
      },

      routes: validatedRoutes,

      verified: false,
      isOnline: false,
      walletBalance: 0,
      ratings: {
        totalRatings: 0,
        averageRating: 0,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Driver onboarded successfully",
      data: driver,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleDriverStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const driverId = req.params.id;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return next(createError(400, "isOnline must be true or false"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return next(createError(404, "Driver not found"));
    }

    driver.isOnline = isOnline;
    await driver.save();

    return res.status(200).json({
      success: true,
      message: `Driver is now ${isOnline ? "online" : "offline"}`,
      data: { driverId: driver._id, isOnline: driver.isOnline },
    });
  } catch (err) {
    next(err);
  }
};

export const updateDriverLocation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const driverId = req.params.id;
    const { longitude, latitude } = req.body;

    // 1. Validate fields
    if (longitude === undefined || latitude === undefined) {
      return next(createError(400, "longitude and latitude are required"));
    }

    // 2. Verify driver
    const driver = await Driver.findById(driverId);
    if (!driver) {
      return next(createError(404, "Driver not found"));
    }

    // 3. Update location
    driver.location = {
      type: "Point",
      coordinates: [longitude, latitude], // GeoJSON expects [lng, lat]
    };

    // Optional: Mark them online automatically when they send location
    driver.isOnline = true;

    await driver.save();

    return res.json({
      success: true,
      message: "Driver location updated",
      data: driver,
    });
  } catch (err) {
    next(err);
  }
};

export const addDriverRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const driverId = req.params.id;
    const { routeTemplateId, selectedStops, times } = req.body;

    if (!routeTemplateId || !selectedStops || !times) {
      return next(createError(400, "Missing required route fields"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return next(createError(404, "Driver not found"));

    const template = await RouteTemplate.findById(routeTemplateId);
    if (!template) return next(createError(404, "Route template not found"));

    const newRoute = {
      routeTemplateId,
      from: template.from,
      to: template.to,
      selectedStops,
      times,
    };

    driver.routes.push(newRoute);
    await driver.save();

    return res.status(201).json({
      success: true,
      message: "Route added successfully",
      data: driver.routes[driver.routes.length - 1],
    });
  } catch (err) {
    next(err);
  }
};

export const updateDriverRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, routeId } = req.params;
    const updates = req.body;

    const driver = await Driver.findById(id);
    if (!driver) return next(createError(404, "Driver not found"));

    const route = (driver.routes as any).id(routeId);
    if (!route) return next(createError(404, "Route not found"));

    Object.assign(route, updates);
    await driver.save();

    return res.json({
      success: true,
      message: "Route updated successfully",
      data: route,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDriverRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, routeId } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) return next(createError(404, "Driver not found"));

    const route = (driver.routes as any).id(routeId);
    if (!route) return next(createError(404, "Route not found"));

    route.deleteOne();
    await driver.save();

    return res.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
