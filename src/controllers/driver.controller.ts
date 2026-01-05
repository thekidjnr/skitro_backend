import { Request, Response, NextFunction } from "express";
import { Driver } from "../models/driver.model";
import { createError } from "../utils/error.utils";
import { RouteTemplate } from "../models/routeTemplate.model";
import mongoose from "mongoose";
import { User } from "../models/user.model";
import { generateToken } from "../utils/jwt.utils";

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

    // 3. Validate route templates (ID-based)
    const validatedRoutes = [];

    for (const r of routes) {
      const template = await RouteTemplate.findById(r.routeTemplateId);
      if (!template) {
        return next(
          createError(404, `Route template not found: ${r.routeTemplateId}`)
        );
      }

      // Ensure from/to exist in template
      const stopIds = [
        template.from._id.toString(),
        template.to._id.toString(),
        ...template.stops.map((s) => s._id.toString()),
      ];

      if (!stopIds.includes(r.from) || !stopIds.includes(r.to)) {
        return next(
          createError(400, "Invalid from/to stop for route template")
        );
      }

      // Ensure selected stops belong to template
      if (r.selectedStops?.some((s: string) => !stopIds.includes(s))) {
        return next(
          createError(400, "Invalid selected stop for route template")
        );
      }

      validatedRoutes.push({
        routeTemplateId: r.routeTemplateId,
        from: r.from, // ObjectId
        to: r.to, // ObjectId
        selectedStops: r.selectedStops || [],
        times: r.times.map((t: string) => ({
          time: t,
          enabled: true,
        })),
        active: false,
      });
    }

    // 4. Create driver entry
    const driver = await Driver.create({
      userId,
      vehicleRegNumber,
      vehicleType,
      vehicleCapacity: vehicleCapacity || 15,

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

    const user = await User.findByIdAndUpdate(
      userId,
      {
        driverId: driver._id,
        $addToSet: { role: "driver" },
      },
      { new: true }
    );

    const token = generateToken(user!);

    return res.status(201).json({
      success: true,
      message: "Driver onboarded successfully",
      data: {
        driver,
        user,
        token,
      },
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

export const getDriver = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const driverId = req.user?.driverId;
    if (!driverId) return next(createError(401, "Not authorized"));

    const driver = await Driver.findById(driverId);
    if (!driver) return next(createError(404, "Driver not found"));

    const user = await User.findById(driver.userId);
    if (!user) return next(createError(404, "User not found"));

    return res.json({
      success: true,
      data: {
        driver,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDriverById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const driver = await Driver.findById(id);
    if (!driver) return next(createError(404, "Driver not found"));

    const user = await User.findById(driver.userId);
    if (!user) return next(createError(404, "User not found"));

    return res.json({
      success: true,
      data: {
        driver,
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const searchDriversByRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { routeTemplateId, fromId, toId } = req.query;

    if (!routeTemplateId || !fromId || !toId) {
      return next(
        createError(400, "routeTemplateId, fromId and toId are required")
      );
    }

    const routeTemplateObjectId = new mongoose.Types.ObjectId(
      routeTemplateId as string
    );
    const fromObjectId = new mongoose.Types.ObjectId(fromId as string);
    const toObjectId = new mongoose.Types.ObjectId(toId as string);

    const routeTemplate = await RouteTemplate.findById(routeTemplateObjectId);

    if (!routeTemplate) {
      return next(createError(404, "Route template not found"));
    }

    const allStops = [
      routeTemplate.from,
      ...routeTemplate.stops,
      routeTemplate.to,
    ];

    const fromIndex = allStops.findIndex(
      (s) => s._id.toString() === fromObjectId.toString()
    );

    const toIndex = allStops.findIndex(
      (s) => s._id.toString() === toObjectId.toString()
    );

    if (fromIndex === -1 || toIndex === -1 || fromIndex >= toIndex) {
      return next(createError(400, "Invalid stop order"));
    }

    const drivers = await Driver.find({
      isOnline: true,
      seatsAvailable: { $gt: 0 },

      routes: {
        $elemMatch: {
          routeTemplateId: routeTemplateObjectId,
          active: true,

          $and: [
            {
              $or: [{ from: fromObjectId }, { selectedStops: fromObjectId }],
            },
            {
              $or: [{ to: toObjectId }, { selectedStops: toObjectId }],
            },
          ],
        },
      },
    });

    const matchedDrivers = drivers
      .map((driver) => {
        const matchingRoutes = driver.routes.filter((route) => {
          if (!route.active) return false;

          if (
            route.routeTemplateId.toString() !==
            routeTemplateObjectId.toString()
          ) {
            return false;
          }

          const fromMatch =
            route.from.toString() === fromObjectId.toString() ||
            route.selectedStops.some(
              (s) => s.toString() === fromObjectId.toString()
            );

          const toMatch =
            route.to.toString() === toObjectId.toString() ||
            route.selectedStops.some(
              (s) => s.toString() === toObjectId.toString()
            );

          return fromMatch && toMatch;
        });

        if (!matchingRoutes.length) return null;

        return {
          driverId: driver._id,
          vehicleType: driver.vehicleType,
          routes: matchingRoutes,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      count: matchedDrivers.filter(Boolean).length,
      drivers: matchedDrivers.filter(Boolean),
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
    const { routeTemplateId, from, to, selectedStops, times } = req.body;

    if (!routeTemplateId || !from || !to || !times) {
      return next(createError(400, "Missing required route fields"));
    }

    const driver = await Driver.findById(driverId);
    if (!driver) return next(createError(404, "Driver not found"));

    const template = await RouteTemplate.findById(routeTemplateId);
    if (!template) return next(createError(404, "Route template not found"));

    // Validate that from/to/selectedStops exist in template
    const stopIds = template.stops.map((s) => s._id.toString());

    if (!stopIds.includes(from) || !stopIds.includes(to)) {
      return next(createError(400, "Invalid from/to stop for route template"));
    }

    if (selectedStops?.some((s: string) => !stopIds.includes(s))) {
      return next(createError(400, "Invalid selected stop for route template"));
    }

    const newRoute = {
      routeTemplateId,
      from,
      to,
      selectedStops: selectedStops || [],
      times: times.map((t: string) => ({ time: t, enabled: true })),
      active: false,
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
