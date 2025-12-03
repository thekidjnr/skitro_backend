import { Schema, model } from "mongoose";

interface IRouteTemplate {
  from: string;
  to: string;
  stops: string[];
  estimatedDuration?: number;
  distance?: number;
  baseFare?: number;
}

const routeTemplateSchema = new Schema<IRouteTemplate>(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    stops: [{ type: String, required: true }],
    estimatedDuration: { type: Number, default: null },
    distance: { type: Number, default: null },
    baseFare: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const RouteTemplate = model<IRouteTemplate>(
  "RouteTemplate",
  routeTemplateSchema
);
