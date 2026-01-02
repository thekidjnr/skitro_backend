import { Router } from "express";
import {
  createRouteTemplate,
  getRouteTemplateById,
  updateRouteTemplate,
  deleteRouteTemplate,
  getRouteTemplates,
} from "../controllers/routeTemplate.controller";

const router = Router();

router.get("/", getRouteTemplates);

export default router;
