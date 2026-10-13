import { WebSocket } from "ws";

export interface UserSession {
  userId: string;
  username: string;
  conversationId: string;
}

export type ActiveConnections = Map<WebSocket, UserSession>;

export interface ReplyToPayload {
  id: string;
  user: string;
  text: string;
}

export interface EventPayload {
  userId: string;
  conversationId: string;
  text?: string;
  replyTo?: ReplyToPayload | null;
}

export type IncomingEvent =
  | { type: "JOIN_ROOM"; payload: Omit<EventPayload, "text" | "replyTo"> }
  | {
      type: "SEND_MESSAGE";
      payload: Omit<EventPayload, "text"> & { text: string };
    }
  | { type: "TYPING_START"; payload: Omit<EventPayload, "text" | "replyTo"> }
  | { type: "TYPING_STOP"; payload: Omit<EventPayload, "text" | "replyTo"> };

export type OutgoingEvent =
  | { type: "NEW_MESSAGE"; payload: FormattedMessageDTO }
  | {
      type: "MESSAGE_EDITED";
      payload: { messageId: string; conversationId: string; text: string };
    }
  | {
      type: "MESSAGE_DELETED";
      payload: { messageId: string; conversationId: string };
    }
  | {
      type: "MESSAGES_READ";
      payload: { conversationId: string; userId: string };
    }
  | { type: "USER_TYPING"; payload: { conversationId: string; userId: string } }
  | {
      type: "USER_STOPPED_TYPING";
      payload: { conversationId: string; userId: string };
    };

export interface FormattedMessageDTO {
  id: string;
  user: string;
  text: string;
  status: "SENT" | "DELIVERED" | "READ";
  timeStamp: Date;
  replyTo?: ReplyToPayload | null;
}

export interface PaginatedMessagesResponse {
  messages: FormattedMessageDTO[];
  nextCursor: string | null;
  hasMore: boolean;
}
