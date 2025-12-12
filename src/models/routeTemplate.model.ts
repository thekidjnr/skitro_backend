import { Schema, model } from "mongoose";

interface IRouteStop {
  name: string;
  lat: number;
  lng: number;
}

interface IRouteTemplate {
  from: IRouteStop;
  to: IRouteStop;
  stops: IRouteStop[];
  stopDistances?: number[]; // kms between successive stops
  baseFare?: number;
  pricePerKm?: number;
  estimatedDuration?: number;
  totalDistance?: number;
}

const stopSchema = new Schema<IRouteStop>({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

const routeTemplateSchema = new Schema<IRouteTemplate>(
  {
    from: { type: stopSchema, required: true },
    to: { type: stopSchema, required: true },

    stops: { type: [stopSchema], required: true },

    stopDistances: { type: [Number], default: [] },
    baseFare: { type: Number, default: 0 },
    pricePerKm: { type: Number, default: 2 }, // example value per km
    estimatedDuration: { type: Number, default: null },
    totalDistance: { type: Number, default: null },
  },
  { timestamps: true }
);

export const RouteTemplate = model<IRouteTemplate>(
  "RouteTemplate",
  routeTemplateSchema
);
