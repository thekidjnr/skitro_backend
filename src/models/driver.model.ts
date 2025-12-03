import { ObjectId, Schema, model } from "mongoose";

interface IRouteTime {
  time: string;
  enabled: boolean;
}

interface IDriverRoute {
  routeTemplateId: ObjectId;
  from: string;
  to: string;
  selectedStops: string[];
  times: IRouteTime[];
  active?: boolean;
  date?: Date;
}

interface IDriver {
  userId: ObjectId;

  vehicleRegNumber: string;
  vehicleType: string;
  vehicleCapacity?: number;
  seatsAvailable?: number;

  vehicleImage: {
    url: string;
    public_id: string;
  };

  licenseImage: {
    url: string;
    public_id: string;
  };

  routes: IDriverRoute[];

  isOnline?: boolean;

  location?: {
    type: "Point";
    coordinates: number[];
  };

  walletBalance?: number;

  ratings?: {
    totalRatings: number;
    averageRating: number;
  };

  verified: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const driverSchema = new Schema<IDriver>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    vehicleRegNumber: { type: String, required: true },
    vehicleType: { type: String, required: true },
    vehicleCapacity: { type: Number, default: 15 },
    seatsAvailable: { type: Number, default: 15 },

    vehicleImage: {
      url: { type: String, default: null },
      public_id: { type: String, default: null },
    },

    licenseImage: {
      url: { type: String, required: true },
      public_id: { type: String, required: true },
    },

    routes: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        routeTemplateId: {
          type: Schema.Types.ObjectId,
          ref: "Route",
          required: true,
        },
        from: { type: String, required: true },
        to: { type: String, required: true },
        selectedStops: [{ type: String, required: true }],
        times: [
          {
            time: { type: String, required: true },
            enabled: { type: Boolean, default: true },
          },
        ],
        active: { type: Boolean, default: false },
        date: { type: Date, default: null },
      },
    ],

    isOnline: { type: Boolean, default: false },

    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },

    walletBalance: { type: Number, default: 0 },

    ratings: {
      totalRatings: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0 },
    },

    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Enable geospatial queries
driverSchema.index({ location: "2dsphere" });

export const Driver = model<IDriver>("Driver", driverSchema);
