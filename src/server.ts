import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import app from "./app";
import { startTripGenerationCron } from "./controllers/trip.controller";

const PORT = process.env.PORT;
const MONGO_URI = process.env.MONGO_URI || "";

async function start() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("MongoDB connected");

    startTripGenerationCron();
    console.log("Cron job initialized");

    app.listen(PORT, () => {
      console.log(`Skitro API running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Error starting server:", err);
  }
}

start();
