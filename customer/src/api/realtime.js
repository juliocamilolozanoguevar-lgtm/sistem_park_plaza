import { io } from "socket.io-client";
import { apiOrigin } from "../config/api";

export const realtime = io(apiOrigin, {
  autoConnect: false,
  transports: ["websocket", "polling"],
  reconnection: true,
  auth: (cb) => cb({ token: localStorage.getItem("pp_customer_token") || "" })
});

export function connectCustomerRealtime() {
  const token = localStorage.getItem("pp_customer_token");
  if (!token) {
    if (realtime.connected) realtime.disconnect();
    return;
  }
  realtime.auth = { token };
  if (!realtime.connected) realtime.connect();
}
