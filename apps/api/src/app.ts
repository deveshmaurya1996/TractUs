import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import logger from "./lib/logger";
import organizationsRouter from "./routes/organizations";
import contractsRouter from "./routes/contracts";
import docsRouter from "./routes/docs";

export function createApp() {
  const app = express();
  if (process.env.NODE_ENV === "production" || process.env.TRUST_PROXY === "true") {
    app.set("trust proxy", 1);
  }
  app.use(pinoHttp({ logger }));
  app.use(cors());
  app.use(express.json());
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });
  app.use("/api", docsRouter);
  app.use("/api/organizations", organizationsRouter);
  app.use("/api/contracts", contractsRouter);
  return app;
}
