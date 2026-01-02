// import { Request, Response, NextFunction } from "express";
// import Trip from "../models/trip.model";
// import { createError } from "../utils/error.utils";
// import cron from "node-cron";
// import { Driver } from "../models/driver.model";
// import { startOfDay } from "date-fns";
// import { RouteTemplate } from "../models/routeTemplate.model";

// export const searchTrips = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { routeTemplateId, date } = req.query;

//     if (!routeTemplateId) {
//       return next(createError(400, "routeTemplateId is required"));
//     }

//     const trips = await Trip.find({
//       routeTemplateId,
//       ...(date ? { date } : {}),
//       availableSeats: { $gt: 0 },
//     }).populate("driverId");

//     return res.json({
//       success: true,
//       trips,
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// export function startTripGenerationCron() {
//   cron.schedule("5 0 * * *", async () => {
//     console.log("🚍 Trip Generation Cron Started...");

//     try {
//       const drivers = await Driver.find({ isOnline: true });

//       for (const driver of drivers) {
//         for (const route of driver.routes) {
//           if (!route.active) continue;

//           const today = startOfDay(new Date());

//           const existingTrip = await Trip.findOne({
//             driverId: driver._id,
//             routeTemplateId: route.routeTemplateId,
//             date: today,
//           });

//           if (existingTrip) {
//             console.log(
//               `⏭ Trip already exists for driver ${driver._id} on ${today}`
//             );
//             continue;
//           }

//           // Generate one trip per enabled time slot
//           for (const t of route.times) {
//             if (!t.enabled) continue;

//             const trip = new Trip([
//               {
//                 driverId: driver._id,
//                 routeTemplateId: route.routeTemplateId,
//                 from: route.from,
//                 to: route.to,
//                 stops: route.selectedStops,
//                 time: t.time,
//                 date: today,
//                 totalSeats: driver.vehicleCapacity,
//                 availableSeats: driver.seatsAvailable ?? driver.vehicleCapacity,
//                 price: 0,
//                 status: "scheduled",
//               },
//             ]);

//             await trip.save();

//             console.log(
//               `✅ Trip created for driver ${driver._id} at ${t.time} for ${today}`
//             );
//           }
//         }
//       }

//       console.log("🎉 Trip generation completed.");
//     } catch (err) {
//       console.error("❌ Error in Trip Generation Cron:", err);
//     }
//   });
// }

// export const createTripManually = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { driverId, routeTemplateId, date, time, price } = req.body;

//     if (!driverId || !routeTemplateId || !date || !time) {
//       return next(createError(400, "Missing required fields"));
//     }

//     const driver = await Driver.findById(driverId);
//     if (!driver) return next(createError(404, "Driver not found"));

//     const routeTemplate = await RouteTemplate.findById(routeTemplateId);
//     if (!routeTemplate) {
//       return next(createError(404, "Route Template not found"));
//     }

//     const totalSeats = driver.seatsAvailable || 0;

//     const trip = await Trip.create({
//       driverId,
//       routeTemplateId,
//       from: routeTemplate.from.name,
//       to: routeTemplate.to.name,
//       stops: routeTemplate.stops.map((s) => s.name),
//       date,
//       time,
//       totalSeats,
//       availableSeats: totalSeats,
//       price: price ?? routeTemplate.baseFare,
//     });

//     return res.json({
//       success: true,
//       trip,
//     });
//   } catch (err) {
//     next(err);
//   }
// };
