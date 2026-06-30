import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./lib/logger";
import organizationsRouter from "./routes/organizations";
import contractsRouter from "./routes/contracts";

export function createApp() {
  const app = express();
  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());
  app.use("/api/organizations", organizationsRouter);
  app.use("/api/contracts", contractsRouter);
  return app;
}
