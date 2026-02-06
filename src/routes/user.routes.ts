import express from "express";
import { getUser, updateUser, listUsers } from "../controllers/user.controller";

import {
  saveRoute,
  removeSavedRoute,
  getSavedRoutes,
} from "../controllers/userSavedRoute.controller";

import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// User profile
router.get("/me", protect, getUser);
router.put("/update", protect, updateUser);
router.get("/", protect, listUsers);

// User saved routes
router.post("/saved-routes", protect, saveRoute);
router.get("/saved-routes", protect, getSavedRoutes);
router.delete("/saved-routes/:routeTemplateId", protect, removeSavedRoute);

export default router;
