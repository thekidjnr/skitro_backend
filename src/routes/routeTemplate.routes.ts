import { Router } from "express";
import {
  createRouteTemplate,
  getRouteTemplateById,
  updateRouteTemplate,
  deleteRouteTemplate,
  getRouteTemplates,
  estimateRouteFare,
} from "../controllers/routeTemplate.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.post("/", createRouteTemplate);
router.post("/:id/estimate-fare", protect, estimateRouteFare);

router.get("/", getRouteTemplates);
router.get("/:id", getRouteTemplateById);

router.patch("/:id", updateRouteTemplate);

router.delete("/:id", deleteRouteTemplate);

export default router;
