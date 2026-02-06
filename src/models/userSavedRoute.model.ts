import { Schema, model } from "mongoose";

const userSavedRouteSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    routeTemplateId: {
      type: Schema.Types.ObjectId,
      ref: "RouteTemplate",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

userSavedRouteSchema.index({ userId: 1, routeTemplateId: 1 }, { unique: true });

export const UserSavedRoute = model("UserSavedRoute", userSavedRouteSchema);
