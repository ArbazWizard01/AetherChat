export type MessageType = "TEXT" | "SYSTEM" | "ALERT";

export interface ReplyTo {
  id: string;
  user: string;
  text: string;
}

export interface Message {
  id: string;
  clientMsgId?: string;
  userId?: string;
  user?: string;
  avatarUrl?: string | null;
  conversationId: string;
  text: string;
  status?: "SENT" | "DELIVERED" | "READ";
  timeStamp: string;
  replyTo?: ReplyTo | null;
  type: MessageType;
  isOptimistic?: boolean;
}

export interface SecurityAlertPayload {
  text: string;
}

export interface IncomingSystemEvent {
  type: "SECURITY_ALERT" | "MESSAGES_READ" | "NEW_MESSAGE" | "USER_TYPING" | "USER_STOPPED_TYPING" | "ONLINE_USERS";
  payload: any;
}