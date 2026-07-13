import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.js";

interface SocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      setIsConnected(false);
      return;
    }

    const wsUrl = `ws://localhost:8080?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("⚡ AetherChat Engine: Live real-time stream established.");
      setIsConnected(true);
    };

    ws.onclose = () => {
      console.log("🔌 AetherChat Engine: Stream disconnected.");
      setIsConnected(false);
      setSocket(null);
    };

    ws.onerror = (error) => {
      console.error("WebSocket pipeline error encountered:", error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [token]);

  const sendMessage = (type: string, payload: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, payload }));
    } else {
      console.warn("⚠️ Cannot dispatch message package: Socket channel is currently closed.");
    }
  };

  return (
    <SocketContext.Provider value={{ socket, isConnected, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be executed within an enclosed SocketProvider wrapper.");
  }
  return context;
};