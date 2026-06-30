import { io } from "socket.io-client";
import type { Socket } from "socket.io-client";
import { SOCKET_URL } from "@tractus/utils";

export const socket: Socket = io(SOCKET_URL);
