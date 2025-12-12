import mongoose, { Schema, Document } from "mongoose";

export interface ITrip extends Document {
  driverId: mongoose.Types.ObjectId;
  routeTemplateId: mongoose.Types.ObjectId;

  from: string;
  to: string;
  stops: string[];

  time: string; // e.g. "08:00 AM"
  date: string; // e.g. "2025-12-04"

  totalSeats: number;
  availableSeats: number;

  price: number;

  status: "scheduled" | "ongoing" | "completed" | "cancelled";
}

const tripSchema = new Schema<ITrip>(
  {
    driverId: { type: Schema.Types.ObjectId, ref: "Driver", required: true },
    routeTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "RouteTemplate",
      required: true,
    },

    from: String,
    to: String,
    stops: [String],

    time: String,
    date: String,

    totalSeats: Number,
    availableSeats: Number,

    price: Number,

    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      default: "scheduled",
    },
  },
  { timestamps: true }
);

export default mongoose.model<ITrip>("Trip", tripSchema);
