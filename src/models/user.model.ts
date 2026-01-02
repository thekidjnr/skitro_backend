import { Schema, model } from "mongoose";
import { IUser } from "../types/user.type";

const userSchema = new Schema<IUser>(
  {
    role: { type: [String], enum: ["user", "driver"], default: ["user"] },

    phone: { type: String, required: true, unique: true },
    isPhoneVerified: { type: Boolean, default: false },

    otp: { type: String },
    otpExpiresAt: { type: Date },

    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },

    driverId: { type: Schema.Types.ObjectId, ref: "Driver", default: null },
  },
  { timestamps: true }
);

export const User = model<IUser>("User", userSchema);
