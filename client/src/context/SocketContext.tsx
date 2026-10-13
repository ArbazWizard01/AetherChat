import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";

export interface SocketEvent {
  type: string;
  payload: any;
}

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
  lastEvent: SocketEvent | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8080";

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<SocketEvent | null>(null);

  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const reconnectAttemptsRef = useRef<number>(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const INITIAL_RECONNECT_DELAY = 1000;

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.close(1000, "User logged out");
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    let ws: WebSocket | null = null;
    let isComponentMounted = true;
    let intentionalClose = false;

    const connect = () => {
      if (!isComponentMounted || !token) return;

      const wsUrl = `${WS_BASE_URL}?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (isComponentMounted) {
          console.log(
            "⚡ AetherChat Engine: Live real-time stream established.",
          );
          setIsConnected(true);
          setSocket(ws);
          reconnectAttemptsRef.current = 0;
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsedEvent: SocketEvent = JSON.parse(event.data);
          if (isComponentMounted) {
            setLastEvent(parsedEvent);
          }
        } catch (error) {
          console.error("Error parsing WebSocket event payload:", error);
        }
      };

      ws.onclose = (event) => {
        if (isComponentMounted) {
          setIsConnected(false);
          setSocket(null);
        }

        if (intentionalClose || event.code === 1000 || !isComponentMounted) {
          return;
        }

        if (token && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay =
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current);
          console.log(
            `🔌 AetherChat Engine: Stream disconnected. Retrying in ${delay}ms... (Attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`,
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isComponentMounted) {
              reconnectAttemptsRef.current += 1;
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn(
            "🔌 AetherChat Engine: Maximum reconnection limit reached.",
          );
        }
      };

      ws.onerror = (error) => {
        if (isComponentMounted && ws?.readyState === WebSocket.OPEN) {
          console.error("WebSocket pipeline error encountered:", error);
        }
      };
    };

    connect();

    return () => {
      isComponentMounted = false;
      intentionalClose = true;

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (ws) {
        ws.close(1000, "Component unmounted");
      }
    };
  }, [token]);

  const sendMessage = (type: string, payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn(
        "⚠️ Cannot dispatch message package: Socket channel is currently closed.",
      );
    }
  };

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, sendMessage, lastEvent }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error(
      "useSocket must be executed within an enclosed SocketProvider wrapper.",
    );
  }
  return context;
};
