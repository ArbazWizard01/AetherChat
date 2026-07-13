import React, { useState, useEffect, useRef } from "react";
import { Input, Button, Typography, Avatar } from "antd";
import { SendOutlined, CheckOutlined } from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext.js";
import { useSocket } from "../context/SocketContext.js";
import { formatTime12Hour, formatSmartDate } from "../utils/dateFormatter.js";

import {
  PaneContainer,
  PaneHeader,
  HeaderMeta,
  MessageTimeline,
  BubbleWrapper,
  MessageBubble,
  SenderName,
  TimestampWrapper,
  TypingBanner,
  InputFooter,
} from "./ChatPane.styles.js";

const { Title, Text } = Typography;

interface ChatPaneProps {
  conversationId: string;
  conversationName: string;
}

interface StreamMessage {
  id: string;
  user: string;
  text: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  timeStamp: string;
}

export const ChatPane: React.FC<ChatPaneProps> = ({
  conversationId,
  conversationName,
}) => {
  const { user } = useAuth();
  const { socket, sendMessage } = useSocket();
  const [typedText, setTypedText] = useState("");
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(false);

  const timelineEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser]);

  useEffect(() => {
    setMessages([]);
    setTypingUser(null);
    setIsPeerOnline(false);

    axios
      .get(`http://localhost:8080/api/conversations/${conversationId}/messages`)
      .then((res) => {
        const structuredHistory = res.data.map((msg: any) => ({
          id: msg.id,
          user: msg.user?.username || "Unknown",
          text: msg.text,
          status: msg.status,
          timeStamp: msg.createdAt,
        }));
        setMessages(structuredHistory);
      });

    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage("JOIN_ROOM", { conversationId });
    }
  }, [conversationId, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingStream = (event: MessageEvent) => {
      try {
        const dataPacket = JSON.parse(event.data);

        switch (dataPacket.type) {
          case "NEW_MESSAGE":
            setMessages((prev) =>
              prev.some((m) => m.id === dataPacket.payload.id)
                ? prev
                : [...prev, dataPacket.payload],
            );
            break;

          case "MESSAGES_READ":
            setMessages((prev) =>
              prev.map((m) =>
                m.status !== "READ" ? { ...m, status: "READ" } : m,
              ),
            );
            break;

          case "USER_TYPING_START":
            setTypingUser(dataPacket.payload.username);
            break;

          case "USER_TYPING_STOP":
            setTypingUser(null);
            break;

          case "ONLINE_USERS": {
            const activeUsernames: string[] = dataPacket.payload.users || [];
            const isTargetConnected = activeUsernames.some(
              (name) => name.toLowerCase() === conversationName.toLowerCase(),
            );
            setIsPeerOnline(isTargetConnected);
            break;
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    socket.addEventListener("message", handleIncomingStream);
    return () => socket.removeEventListener("message", handleIncomingStream);
  }, [socket, conversationId, conversationName]);

  const handleDispatch = () => {
    if (!typedText.trim()) return;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          user: user?.username || "Me",
          text: typedText.trim(),
          status: "FAILED",
          timeStamp: new Date().toISOString(),
        },
      ]);
      setTypedText("");
      return;
    }

    sendMessage("SEND_MESSAGE", { conversationId, text: typedText.trim() });
    setTypedText("");
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendMessage("TYPING_STOP", { conversationId });
  };

  const renderStatusTicks = (
    status: "SENT" | "DELIVERED" | "READ" | "FAILED",
  ) => {
    switch (status) {
      case "FAILED":
        return (
          <span
            style={{
              color: "#ff4d4f",
              fontSize: "10px",
              fontWeight: "bold",
              marginLeft: "6px",
            }}
          >
            ⚠️ Failed
          </span>
        );
      case "SENT":
        return (
          <CheckOutlined
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "11px",
              marginLeft: "5px",
            }}
          />
        );
      case "DELIVERED":
        return (
          <span
            style={{
              marginLeft: "5px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <CheckOutlined
              style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: "11px" }}
            />
            <CheckOutlined
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "11px",
                marginLeft: "-6px",
              }}
            />
          </span>
        );
      case "READ":
        return (
          <span
            style={{
              marginLeft: "5px",
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <CheckOutlined style={{ color: "#00e5ff", fontSize: "11px" }} />
            <CheckOutlined
              style={{ color: "#00e5ff", fontSize: "11px", marginLeft: "-6px" }}
            />
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <PaneContainer>
      <PaneHeader>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Avatar style={{ backgroundColor: "#87d068" }}>
            {conversationName.charAt(0).toUpperCase()}
          </Avatar>
          <HeaderMeta>
            <Title level={4} style={{ margin: 0 }}>
              {conversationName}
            </Title>

            {isPeerOnline ? (
              <Text
                style={{
                  color: "#52c41a",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              >
                online
              </Text>
            ) : (
              <Text type="secondary" style={{ fontSize: "12px" }}>
                offline
              </Text>
            )}
          </HeaderMeta>
        </div>
      </PaneHeader>

      <MessageTimeline>
        {messages.map((msg, index) => {
          const isMe = msg.user.toLowerCase() === user?.username.toLowerCase();
          const currentDateLabel = formatSmartDate(msg.timeStamp);
          const previousMessage = messages[index - 1];
          const previousDateLabel = previousMessage
            ? formatSmartDate(previousMessage.timeStamp)
            : null;
          const showDateSeparator = currentDateLabel !== previousDateLabel;

          return (
            <React.Fragment key={msg.id}>
              {showDateSeparator && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    margin: "14px 0",
                  }}
                >
                  <span
                    style={{
                      background: "#dfe5e8",
                      color: "#4a5568",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: 600,
                    }}
                  >
                    {currentDateLabel}
                  </span>
                </div>
              )}

              <BubbleWrapper $isMe={isMe}>
                <MessageBubble $isMe={isMe}>
                  {!isMe && <SenderName>{msg.user}</SenderName>}
                  <div style={{ whiteSpace: "pre-wrap" }}>{msg.text}</div>
                  <TimestampWrapper>
                    {formatTime12Hour(msg.timeStamp)}
                    {isMe && renderStatusTicks(msg.status)}
                  </TimestampWrapper>
                </MessageBubble>
              </BubbleWrapper>
            </React.Fragment>
          );
        })}
        <div ref={timelineEndRef} />
      </MessageTimeline>

      <TypingBanner>
        {typingUser && `${typingUser} is composing a message...`}
      </TypingBanner>

      <InputFooter>
        <Input.TextArea
          placeholder="Type a message..."
          value={typedText}
          onChange={(e) => {
            setTypedText(e.target.value);
            if (typedText.length === 0)
              sendMessage("TYPING_START", { conversationId });
            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(
              () => sendMessage("TYPING_STOP", { conversationId }),
              2000,
            );
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleDispatch();
            }
          }}
          autoSize={{ minRows: 1, maxRows: 5 }}
          style={{ resize: "none", borderRadius: "8px", padding: "8px 12px" }}
        />
        <Button
          type="primary"
          size="large"
          icon={<SendOutlined />}
          onClick={handleDispatch}
          style={{
            height: "40px",
            width: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </InputFooter>
    </PaneContainer>
  );
};
