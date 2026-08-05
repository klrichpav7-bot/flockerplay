"use client";

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket(userId: string): Socket {
  if (!socket) {
    const base = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin;
    socket = io(base, {
      path: "/api/socket",
      auth: { userId },
      transports: ["websocket"],
    });
  }
  return socket;
}
