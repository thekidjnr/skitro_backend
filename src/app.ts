import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);

app.get("/", (req: Request, res: Response) => {
  res.send("Skitro API is running...");
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong";

  return res.status(errorStatus).json({
    success: false,
    status: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export default app;
