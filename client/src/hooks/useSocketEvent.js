import { useEffect, useRef } from "react";
import { useSocket } from "../providers/SocketProvider";

export function useSocketEvent(event, handler, enabled = true) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled || !socket || !event) return undefined;
    const listener = (...args) => handlerRef.current?.(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [enabled, event, socket]);
}
