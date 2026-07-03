import { WebSocket } from "ws";

export interface UserSession {
  userId: string;
  username: string;
  conversationId: string;
}

export type ActiveConnections = Map<WebSocket, UserSession>;

export interface EventPayload {
  userId: string;
  conversationId: string;
  text?: string;
}

export type IncomingEvent =
  | { type: "SEND_MESSAGE"; payload: Required<EventPayload> }
  | { type: "TYPING_START"; payload: Omit<EventPayload, "text"> }
  | { type: "TYPING_STOP"; payload: Omit<EventPayload, "text"> };
