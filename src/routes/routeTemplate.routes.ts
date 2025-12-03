import { Router } from "express";
import {
  createRouteTemplate,
  getRouteTemplateById,
  updateRouteTemplate,
  deleteRouteTemplate,
  getRouteTemplates,
} from "../controllers/routeTemplate.controller";

const router = Router();

router.post("/", createRouteTemplate);

router.get("/", getRouteTemplates);
router.get("/:id", getRouteTemplateById);

router.patch("/:id", updateRouteTemplate);

router.delete("/:id", deleteRouteTemplate);

export default router;
