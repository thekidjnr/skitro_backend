import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  userId: mongoose.Types.ObjectId;
  tripId: mongoose.Types.ObjectId;

  seats: number;
  amountPaid: number;

  status: "booked" | "cancelled";
}

const bookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tripId: { type: Schema.Types.ObjectId, ref: "Trip", required: true },
    seats: { type: Number, required: true },
    amountPaid: Number,
    status: { type: String, enum: ["booked", "cancelled"], default: "booked" },
  },
  { timestamps: true }
);

export default mongoose.model<IBooking>("Booking", bookingSchema);
