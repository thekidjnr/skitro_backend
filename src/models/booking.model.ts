import mongoose, { Schema, Document, model } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;

  driverId: mongoose.Types.ObjectId;
  routeTemplateId: mongoose.Types.ObjectId;

  date: string;
  time: string;

  from: mongoose.Types.ObjectId;

  to: mongoose.Types.ObjectId;

  vehicleType: mongoose.Types.ObjectId;

  fee: number;

  status: "pending" | "booked" | "cancelled" | "completed";
  paymentStatus: "pending" | "paid" | "refunded";

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

    date: { type: String, required: true },
    time: { type: String, required: true },

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
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

bookingSchema.index({
  driverId: 1,
  routeTemplateId: 1,
  date: 1,
  time: 1,
  status: 1,
});

bookingSchema.index({ userId: 1 });

export const Booking = model<IBooking>("Booking", bookingSchema);
