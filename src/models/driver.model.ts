import { ObjectId, Schema, model } from "mongoose";

interface IDriver {
  userId: ObjectId;
  vehicleRegNumber: string;
  vehicleType: string;
  vehicleImage: string;
  licenseImage: string;
  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    vehicleRegNumber: { type: String, required: true },
    vehicleType: { type: String, required: true },
    vehicleImage: { type: String, required: true },
    licenseImage: { type: String, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Driver = model<IDriver>("Driver", driverSchema);
