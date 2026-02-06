import mongoose, { Schema, model, Types } from "mongoose";

export interface ITrip {
  driverId: Types.ObjectId;
  routeTemplateId: Types.ObjectId;

  departureTime: Date; // combined date + time

  from: Types.ObjectId;
  to: Types.ObjectId;

  vehicleCapacity: number;
  seatsBooked: number;

  status: "scheduled" | "departed" | "completed" | "cancelled";

  createdAt?: Date;
  updatedAt?: Date;
}

const tripSchema = new Schema<ITrip>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    routeTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "RouteTemplate",
      required: true,
    },

    departureTime: { type: Date, required: true },

    from: { type: Schema.Types.ObjectId, required: true },
    to: { type: Schema.Types.ObjectId, required: true },

    vehicleCapacity: { type: Number, required: true },
    seatsBooked: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["scheduled", "departed", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true },
);

// unique index to prevent duplicate trips for same driver + route + departure
tripSchema.index(
  { driverId: 1, routeTemplateId: 1, departureTime: 1 },
  { unique: true },
);

export const Trip = model<ITrip>("Trip", tripSchema);
