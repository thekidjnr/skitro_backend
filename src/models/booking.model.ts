import mongoose, { Schema, Document, model } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;

  driverId: mongoose.Types.ObjectId;
  routeTemplateId: mongoose.Types.ObjectId;

  date: string;
  time: string;

  from: {
    id: mongoose.Types.ObjectId;
    name: string;
  };

  to: {
    id: mongoose.Types.ObjectId;
    name: string;
  };

  vehicleType: mongoose.Types.ObjectId;

  fee: number;

  status: "booked" | "cancelled" | "completed";
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

    from: {
      id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },

    to: {
      id: { type: Schema.Types.ObjectId, required: true },
      name: { type: String, required: true },
    },

    vehicleType: {
      type: Schema.Types.ObjectId,
      ref: "VehicleType",
      required: true,
    },

    fee: { type: Number, required: true },

    status: {
      type: String,
      enum: ["booked", "cancelled", "completed"],
      default: "booked",
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
