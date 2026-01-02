import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { Driver } from "../models/driver.model";
import mongoose from "mongoose";
import { RouteTemplate } from "../models/routeTemplate.model";
