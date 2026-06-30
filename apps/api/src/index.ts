import "./load-env";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import pinoHttp from "pino-http";
import logger from "./lib/logger";
import organizationsRouter from "./routes/organizations";
import contractsRouter from "./routes/contracts";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());

app.use("/api/organizations", organizationsRouter);
app.use("/api/contracts", contractsRouter);

io.on("connection", (socket) => {
  logger.info("Client connected");
  socket.on("disconnect", () => {
    logger.info("Client disconnected");
  });
});

export { io };

const PORT = process.env.PORT || 3001;

async function start() {
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

start().catch((err) => {
  logger.error(err);
  process.exit(1);
});
