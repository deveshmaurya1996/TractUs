import "./load-env";
import http from "http";
import logger from "./lib/logger";
import { createApp } from "./app";
import { initSocket } from "./lib/socket";

const app = createApp();
const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
