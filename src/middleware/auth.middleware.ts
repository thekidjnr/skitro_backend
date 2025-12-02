import { Request, Response, NextFunction } from "express";
import { createError } from "../utils/error.utils";
import { verifyToken } from "../utils/jwt.utils";

interface JwtPayload {
  id: string;
  phone: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(createError(401, "Not authorized"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token) as JwtPayload;

    req.user = decoded;
    next();
  } catch (err) {
    next(createError(401, "Invalid or expired token"));
  }
};
