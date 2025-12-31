import { Schema, model, Document } from "mongoose";

export interface IVehicleType extends Document {
  name: string;
  capacity?: number; // optional: number of seats this vehicle type has
  stickerImage: {
    url: string;
    public_id: string;
  };
  active: boolean;
}

const vehicleTypeSchema = new Schema<IVehicleType>(
  {
    name: { type: String, required: true, unique: true },

    stickerImage: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Index on name for faster lookups
vehicleTypeSchema.index({ name: 1 });

export const VehicleType = model<IVehicleType>(
  "VehicleType",
  vehicleTypeSchema
);
