import { Router } from "express";
import {
  createVehicleType,
  getVehicleTypes,
  toggleVehicleType,
} from "../controllers/vehicleType.controller";
const router = Router();

router.post("/", createVehicleType);
router.get("/", getVehicleTypes);
router.patch("/:id/toggle", toggleVehicleType);

export default router;
