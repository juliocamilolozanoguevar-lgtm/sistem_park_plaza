import { io } from "socket.io-client";
import { apiOrigin } from "../config/api";

// Configuración centralizada de Socket.IO
// El backend dictará los rooms (client_ID o stay_ID).
export const realtime = io(apiOrigin, { 
  transports: ["websocket", "polling"], 
  reconnection: true 
});
