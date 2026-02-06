import mongoose, { Schema, Document, model, Types } from "mongoose";

export interface IBooking extends Document {
  userId: Types.ObjectId;

  driverId: Types.ObjectId;
  routeTemplateId: Types.ObjectId;

  departureTime: Date;

  from: Types.ObjectId;
  to: Types.ObjectId;

  vehicleType: Types.ObjectId;

  fee: number;

  status: "pending" | "booked" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";

  tripId: Types.ObjectId;
  bookingCode: string;
  cancelledAt?: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    driverId: {
      type: Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
    },

    routeTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "RouteTemplate",
      required: true,
    },

    departureTime: { type: Date, required: true },

    from: { type: Schema.Types.ObjectId, required: true },
    to: { type: Schema.Types.ObjectId, required: true },

    vehicleType: {
      type: Schema.Types.ObjectId,
      ref: "VehicleType",
      required: true,
    },

    fee: { type: Number, required: true },

    status: {
      type: String,
      enum: ["pending", "booked", "cancelled", "completed"],
      default: "pending",
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    bookingCode: {
      type: String,
      required: true,
      unique: true,
    },

    tripId: {
      type: Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },

    cancelledAt: { type: Date },
  },
  { timestamps: true },
);

// Index for quick lookups per driver and trip
bookingSchema.index({
  driverId: 1,
  routeTemplateId: 1,
  departureTime: 1,
  status: 1,
});

bookingSchema.index({ userId: 1 });

export const Booking = model<IBooking>("Booking", bookingSchema);
