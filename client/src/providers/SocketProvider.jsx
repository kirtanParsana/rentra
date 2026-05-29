import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthProvider";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL.replace(/\/api\/?$/, "");

const SocketContext = createContext(null);

function getDeviceId() {
  const key = "rentra_device_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function SocketProvider({ children }) {
  const { token, user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [socketInstance, setSocketInstance] = useState(null);
  const [status, setStatus] = useState("idle");
  const [lastError, setLastError] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
      setStatus("idle");
      return undefined;
    }

    const socket = io(SOCKET_URL, {
      auth: {
        token,
        deviceId: getDeviceId(),
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 15000,
    });

    socketRef.current = socket;
    setSocketInstance(socket);
    setStatus("connecting");

    socket.on("connect", () => {
      setStatus("connected");
      setLastError("");
    });
    socket.on("disconnect", () => setStatus("disconnected"));
    socket.on("connect_error", (error) => {
      setStatus("error");
      setLastError(error?.message || "Socket connection failed");
    });
    socket.on("socket:error", (payload) => {
      setLastError(payload?.message || "Realtime error");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setSocketInstance(null);
    };
  }, [isAuthenticated, token]);

  const emitWithAck = useCallback((event, payload = {}, timeout = 12000) => {
    const socket = socketRef.current;
    if (!socket?.connected) {
      return Promise.reject(new Error("Realtime connection is not ready"));
    }
    return new Promise((resolve, reject) => {
      socket.timeout(timeout).emit(event, payload, (error, response) => {
        if (error) return reject(error);
        if (response?.ok === false) return reject(new Error(response.message || "Realtime request failed"));
        return resolve(response);
      });
    });
  }, []);

  const value = useMemo(
    () => ({
      socket: socketInstance,
      status,
      lastError,
      isConnected: status === "connected",
      emitWithAck,
      user,
    }),
    [emitWithAck, lastError, socketInstance, status, user]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used inside SocketProvider");
  return ctx;
}
