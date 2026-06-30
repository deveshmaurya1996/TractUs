import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: "*" },
  });
  io.on("connection", (socket) => {
    socket.on("disconnect", () => undefined);
  });
  return io;
}

export function emitContractEvent(event: string, payload: unknown): void {
  io?.emit(event, payload);
}

export function resetSocketForTests(): void {
  io = null;
}
