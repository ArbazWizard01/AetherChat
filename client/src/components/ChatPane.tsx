import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import axios from "axios";
import styled from "styled-components";
import {
  Dropdown,
  Modal,
  Popover,
  message as antMessage,
  Descriptions,
  Empty,
  Spin,
} from "antd";
import type { MenuProps } from "antd";
import {
  SendOutlined,
  ArrowLeftOutlined,
  MoreOutlined,
  DeleteOutlined,
  CopyOutlined,
  RollbackOutlined,
  EditOutlined,
  PushpinOutlined,
  InfoCircleOutlined,
  SmileOutlined,
  TeamOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { formatTime12Hour, formatSmartDate } from "../utils/dateFormatter";
import { GroupInfoDrawer } from "./GroupInfoDrawer";
import { UserInfoDrawer } from "./UserInfoDrawer";
import { SystemMessageItem } from "./SystemMessageItem";
import { BotMessage } from "./BotMessage";

import {
  PaneContainer,
  PaneHeader,
  HeaderContent,
  HeaderMeta,
  HeaderTitle,
  StatusIndicator,
  StyledAvatar,
  GroupAvatar,
  BackButtonWrapper,
  PinnedHeaderBanner,
  PinnedHeaderContent,
  PinnedIcon,
  CloseIcon,
  MessageTimeline,
  TopSentinel,
  LoadingIndicator,
  DateSeparatorContainer,
  DateBadge,
  BubbleWrapper,
  MessageBubble,
  QuotedReplyBox,
  QuotedUser,
  QuotedText,
  MessageActionWrapper,
  ActionButton,
  SenderName,
  MessageText,
  ReactionsContainer,
  ReactionBadge,
  TimestampWrapper,
  EditedTag,
  FailedTick,
  SingleTick,
  DoubleTickWrapper,
  DoubleTick,
  TypingBanner,
  ContextBanner,
  ContextTextContainer,
  ContextTitle,
  ContextSubtext,
  StyledTextArea,
  SendButton,
  QuickEmojiRow,
  EmojiButton,
  StateContainer,
  InputFooterContainer,
  MentionDropdown,
  MentionHeader,
  MentionItem,
  MentionBotIcon,
  MentionBotName,
} from "./ChatPane.styles";

interface ChatPaneProps {
  conversationId: string;
  conversationName: string;
  isGroup?: boolean;
  onBack?: () => void;
}

interface PeerDetails {
  id?: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

interface GroupSummary {
  name: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  members?: any[];
}

interface StreamMessage {
  id: string;
  clientMsgId?: string;
  type?: "USER" | "SYSTEM" | "SECURITY_ALERT" | "ALERT";
  user: string;
  text: string;
  sender?: string;
  isBot?: string;
  status: "SENT" | "DELIVERED" | "READ" | "FAILED";
  timeStamp: string;
  replyTo?: {
    id: string;
    user: string;
    text: string;
  };
  isEdited?: boolean;
  isPinned?: boolean;
  reactions?: Record<string, string[]>;
}

interface MessagesApiResponse {
  messages: StreamMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

const StyledWarningIcon = styled(WarningOutlined)`
  font-size: 48px;
  color: #ff4d4f;
`;

const QUICK_EMOJIS = ["👍", "❤️", "😂", "🔥", "😮"];

export const ChatPane: React.FC<ChatPaneProps> = ({
  conversationId,
  conversationName,
  isGroup = false,
  onBack,
}) => {
  const { user } = useAuth();
  const { socket, sendMessage } = useSocket();

  const [typedText, setTypedText] = useState("");
  const [messages, setMessages] = useState<StreamMessage[]>([]);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isPeerOnline, setIsPeerOnline] = useState<boolean>(false);

  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [hasLoadError, setHasLoadError] = useState<boolean>(false);
  const [showMentionDropdown, setShowMentionDropdown] =
    useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [peerDetails, setPeerDetails] = useState<PeerDetails | null>(null);
  const [groupSummary, setGroupSummary] = useState<GroupSummary | null>(null);
  const [_currentHeaderTitle, setCurrentHeaderTitle] =
    useState<string>(conversationName);

  const [replyingTo, setReplyingTo] = useState<StreamMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<StreamMessage | null>(
    null,
  );
  const [pinnedMessage, setPinnedMessage] = useState<StreamMessage | null>(
    null,
  );
  const [infoModalMessage, setInfoModalMessage] =
    useState<StreamMessage | null>(null);

  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const timelineEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef<boolean>(false);

  const scrollHeightBeforeFetchRef = useRef<number>(0);
  const isFetchingOlderRef = useRef<boolean>(false);

  const getMentionQuery = (text: string): string | null => {
    const match = text.match(/@([a-zA-Z0-9_]*)$/);
    return match ? match[1].toLowerCase() : null;
  };

  const rawMembers: any[] = (groupSummary as any)?.members || [];

  const myIdentifier =
    (user as any)?.name || (user as any)?.username || (user as any)?.id || "";

  const otherMembers = rawMembers.filter((m: any) => {
    const memberName = m.name || m.username || m.user?.name;
    const memberId = m.id || m._id || m.userId;
    return memberName !== myIdentifier && memberId !== myIdentifier;
  });

  const allCandidates = [
    { id: "aetherbot", name: "AetherBot", username: "AetherBot", isBot: true },
    ...otherMembers.map((m: any) => ({
      id: m.id || m._id || m.userId || m.username,
      name: m.name || m.username || m.user?.name || "Member",
      username: m.username || m.name || m.user?.username || "member",
      isBot: false,
    })),
  ];
  const currentMentionQuery = getMentionQuery(typedText);

  const filteredMentions =
    currentMentionQuery !== null
      ? allCandidates.filter(
          (c) =>
            c.name.toLowerCase().includes(currentMentionQuery) ||
            c.username.toLowerCase().includes(currentMentionQuery),
        )
      : [];

  const handleSelectMention = (targetName: string) => {
    const updatedText = typedText.replace(
      /@([a-zA-Z0-9_]*)$/,
      `@${targetName} `,
    );
    setTypedText(updatedText);
    setShowMentionDropdown(false);
  };

  const renderFormattedMessage = (text: string, isMeMessage: boolean) => {
    const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return (
          <span
            key={i}
            style={{
              color: isMeMessage ? "#ffffff" : "#096dd9",
              backgroundColor: isMeMessage
                ? "rgba(255, 255, 255, 0.25)"
                : "#e6f7ff",
              border: isMeMessage
                ? "1px solid rgba(255, 255, 255, 0.4)"
                : "1px solid #91d5ff",
              padding: "2px 6px",
              borderRadius: "4px",
              fontWeight: 600,
              margin: "0 2px",
              display: "inline-block",
            }}
          >
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const formatAvatarUrl = (url?: string): string | undefined => {
    if (!url) return undefined;
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("data:") ||
      url.startsWith("blob:")
    ) {
      return url;
    }
    return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const fetchLatestMessages = () => {
    axios
      .get<MessagesApiResponse>(
        `http://localhost:8080/api/conversations/${conversationId}/messages?limit=20`,
        { withCredentials: true },
      )
      .then((res) => {
        setMessages(res.data.messages);
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);

        const pinned = res.data.messages.find((m) => m.isPinned);
        if (pinned) setPinnedMessage(pinned);

        setTimeout(() => {
          timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      })
      .catch((err) => {
        console.error("Failed to refetch messages:", err);
      });
  };

  const loadInitialData = () => {
    if (!conversationId) return;

    setIsInitialLoading(true);
    setHasLoadError(false);
    setMessages([]);
    setNextCursor(null);
    setHasMore(true);
    setTypingUser(null);
    setIsPeerOnline(false);
    setReplyingTo(null);
    setEditingMessage(null);
    setPinnedMessage(null);
    setPeerDetails(null);
    setGroupSummary(null);
    setIsDrawerOpen(false);
    setCurrentHeaderTitle(conversationName);

    axios
      .get<MessagesApiResponse>(
        `http://localhost:8080/api/conversations/${conversationId}/messages?limit=20`,
        { withCredentials: true },
      )
      .then((res) => {
        setMessages(res.data.messages);
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);

        const pinned = res.data.messages.find((m) => m.isPinned);
        if (pinned) setPinnedMessage(pinned);

        setTimeout(() => {
          timelineEndRef.current?.scrollIntoView({ behavior: "instant" });
        }, 50);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
        setHasLoadError(true);
        antMessage.error("Unable to load message timeline");
      })
      .finally(() => {
        setIsInitialLoading(false);
      });
    if (isGroup) {
      axios
        .get(
          `http://localhost:8080/api/conversations/${conversationId}/group`,
          { withCredentials: true },
        )
        .then((res) => {
          const groupData =
            res.data?.group ||
            res.data?.data ||
            res.data?.conversation ||
            res.data ||
            {};

          const rawAvatar =
            groupData.avatarUrl ||
            groupData.avatar_url ||
            groupData.avatar ||
            groupData.icon ||
            groupData.imageUrl ||
            groupData.image_url;

          const extractedMembers =
            groupData.members ||
            groupData.groupMembers ||
            groupData.users ||
            [];

          if (res.data) {
            setGroupSummary({
              name: groupData.name || conversationName,
              description: groupData.description,
              avatarUrl: formatAvatarUrl(rawAvatar),
              memberCount:
                extractedMembers.length || groupData.memberCount || 0,
              members: extractedMembers,
            });
            setCurrentHeaderTitle(groupData.name || conversationName);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch group details:", err);
          setGroupSummary({
            name: conversationName,
            memberCount: 0,
            members: [],
          });
        });
    } else {
      axios
        .get(`http://localhost:8080/api/conversations/${conversationId}/peer`, {
          withCredentials: true,
        })
        .then((res) => {
          const raw = res.data?.peer || res.data || {};
          setPeerDetails({
            id: raw.id,
            username: raw.username || conversationName,
            email: raw.email,
            avatarUrl: raw.avatarUrl || raw.avatar_url,
            bio: raw.bio,
            githubUrl: raw.githubUrl || raw.github_url,
            linkedinUrl: raw.linkedinUrl || raw.linkedin_url,
            websiteUrl: raw.websiteUrl || raw.website_url,
          });
        })
        .catch((err) => {
          console.error("Failed to fetch peer details:", err);
          setPeerDetails({ username: conversationName });
        });
    }

    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage("JOIN_ROOM", { conversationId });
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [conversationId, conversationName, isGroup, socket]);

  const fetchOlderMessages = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;

    setIsLoadingMore(true);
    isFetchingOlderRef.current = true;

    if (timelineContainerRef.current) {
      scrollHeightBeforeFetchRef.current =
        timelineContainerRef.current.scrollHeight;
    }

    try {
      const res = await axios.get<MessagesApiResponse>(
        `http://localhost:8080/api/conversations/${conversationId}/messages?limit=20&cursor=${nextCursor}`,
        { withCredentials: true },
      );

      setMessages((prev) => [...res.data.messages, ...prev]);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Failed fetching older messages:", err);
      antMessage.error("Failed to load older messages");
    } finally {
      setIsLoadingMore(false);
    }
  };

  useLayoutEffect(() => {
    if (isFetchingOlderRef.current && timelineContainerRef.current) {
      const newScrollHeight = timelineContainerRef.current.scrollHeight;
      const heightDifference =
        newScrollHeight - scrollHeightBeforeFetchRef.current;
      timelineContainerRef.current.scrollTop = heightDifference;
      isFetchingOlderRef.current = false;
    }
  }, [messages]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = timelineContainerRef.current;
    if (!sentinel || !container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (
          firstEntry.isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          nextCursor
        ) {
          fetchOlderMessages();
        }
      },
      { root: container, threshold: 0.1 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, nextCursor, conversationId]);

  useEffect(() => {
    if (!socket) return;

    const handleIncomingStream = (event: MessageEvent) => {
      try {
        const dataPacket = JSON.parse(event.data);

        switch (dataPacket.type) {
          case "NEW_MESSAGE":
          case "SYSTEM_MESSAGE":
          case "SYSTEM": {
            const incoming: StreamMessage = dataPacket.payload;
            setMessages((prev) => {
              if (prev.some((m) => m.id === incoming.id)) return prev;

              if (incoming.clientMsgId) {
                const existingIdx = prev.findIndex(
                  (m) => m.id === incoming.clientMsgId,
                );
                if (existingIdx !== -1) {
                  const updated = [...prev];
                  updated[existingIdx] = incoming;
                  return updated;
                }
              }

              return [...prev, incoming];
            });

            setTimeout(() => {
              timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 50);
            break;
          }

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
            if (!isGroup) {
              const activeUsernames: string[] = dataPacket.payload.users || [];
              const isTargetConnected = activeUsernames.some(
                (name) => name.toLowerCase() === conversationName.toLowerCase(),
              );
              setIsPeerOnline(isTargetConnected);
            }
            break;
          }
        }
      } catch (err) {
        console.error("WebSocket message parsing error:", err);
      }
    };

    socket.addEventListener("message", handleIncomingStream);
    return () => socket.removeEventListener("message", handleIncomingStream);
  }, [socket, conversationId, conversationName, isGroup]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    antMessage.success("Copied to clipboard");
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    const activeUsername = user?.username || "Me";

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;

        const reactions: Record<string, string[]> = {};
        let alreadyHadThisEmoji = false;

        Object.entries(m.reactions || {}).forEach(([e, users]) => {
          const filteredUsers = users.filter((u) => u !== activeUsername);
          if (e === emoji && users.includes(activeUsername)) {
            alreadyHadThisEmoji = true;
          }
          if (filteredUsers.length > 0) {
            reactions[e] = filteredUsers;
          }
        });

        if (!alreadyHadThisEmoji) {
          reactions[emoji] = [...(reactions[emoji] || []), activeUsername];
        }

        return { ...m, reactions };
      }),
    );

    try {
      await axios.post(
        `http://localhost:8080/api/messages/${messageId}/reactions`,
        { emoji },
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to post reaction:", err);
    }
  };

  const handleTogglePin = async (msg: StreamMessage) => {
    const nextPinnedState = !msg.isPinned;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, isPinned: nextPinnedState } : m,
      ),
    );

    if (nextPinnedState) {
      setPinnedMessage(msg);
      antMessage.success("Message pinned");
    } else {
      if (pinnedMessage?.id === msg.id) setPinnedMessage(null);
      antMessage.info("Message unpinned");
    }

    try {
      await axios.post(
        `http://localhost:8080/api/messages/${msg.id}/pin`,
        { isPinned: nextPinnedState },
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to toggle pin state:", err);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    Modal.confirm({
      title: "Delete Message",
      content: "Are you sure you want to delete this message?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await axios.delete(
            `http://localhost:8080/api/messages/${messageId}`,
            { withCredentials: true },
          );
          setMessages((prev) => prev.filter((m) => m.id !== messageId));
          if (pinnedMessage?.id === messageId) setPinnedMessage(null);
          antMessage.success("Message deleted");
        } catch (err) {
          console.error("Failed to delete message:", err);
          antMessage.error("Could not delete message");
        }
      },
    });
  };

  const handleDispatch = async () => {
    if (!typedText.trim()) return;

    const currentReply = replyingTo
      ? {
          id: replyingTo.id,
          user: replyingTo.user,
          text: replyingTo.text,
        }
      : undefined;

    if (editingMessage) {
      const updatedText = typedText.trim();
      try {
        await axios.patch(
          `http://localhost:8080/api/messages/${editingMessage.id}`,
          { text: updatedText },
          { withCredentials: true },
        );
        setMessages((prev) =>
          prev.map((m) =>
            m.id === editingMessage.id
              ? { ...m, text: updatedText, isEdited: true }
              : m,
          ),
        );
        antMessage.success("Message edited");
      } catch (err) {
        console.error("Failed to edit message:", err);
        antMessage.error("Could not update message");
      } finally {
        setEditingMessage(null);
        setTypedText("");
      }
      return;
    }

    const clientMsgId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newMessagePayload = {
      conversationId,
      text: typedText.trim(),
      replyTo: currentReply,
      clientMsgId,
    };

    const optimisticMsg: StreamMessage = {
      id: clientMsgId,
      clientMsgId,
      user: user?.username || "Me",
      text: typedText.trim(),
      status:
        socket && socket.readyState === WebSocket.OPEN ? "SENT" : "FAILED",
      timeStamp: new Date().toISOString(),
      replyTo: currentReply,
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage("SEND_MESSAGE", newMessagePayload);
    }

    setTypedText("");
    setReplyingTo(null);

    isTypingRef.current = false;
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket && socket.readyState === WebSocket.OPEN) {
      sendMessage("TYPING_STOP", { conversationId });
    }

    setTimeout(() => {
      timelineEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTypedText(newText);

    if (socket && socket.readyState === WebSocket.OPEN) {
      if (!isTypingRef.current && newText.trim().length > 0) {
        isTypingRef.current = true;
        sendMessage("TYPING_START", { conversationId });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        sendMessage("TYPING_STOP", { conversationId });
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleDispatch();
    }
  };

  const renderStatusTicks = (status: StreamMessage["status"]) => {
    switch (status) {
      case "FAILED":
        return <FailedTick>⚠️ Failed</FailedTick>;
      case "SENT":
        return <SingleTick />;
      case "DELIVERED":
        return (
          <DoubleTickWrapper>
            <DoubleTick />
            <DoubleTick $isSecond />
          </DoubleTickWrapper>
        );
      case "READ":
        return (
          <DoubleTickWrapper>
            <DoubleTick $isRead />
            <DoubleTick $isRead $isSecond />
          </DoubleTickWrapper>
        );
      default:
        return null;
    }
  };

  const renderHeaderSubtitle = () => {
    if (isGroup) {
      const count = groupSummary?.memberCount || 0;
      return count > 0 ? `${count} members` : "Group Chat";
    }
    return isPeerOnline ? "online" : "offline";
  };

  const activeHeaderTitle = isGroup
    ? groupSummary?.name || conversationName
    : peerDetails?.username || conversationName;

  return (
    <PaneContainer>
      <PaneHeader>
        <HeaderContent
          onClick={() => setIsDrawerOpen(true)}
          title={
            isGroup
              ? "Click to view group details"
              : "Click to view contact details"
          }
        >
          {onBack && (
            <BackButtonWrapper
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
            >
              <ArrowLeftOutlined />
            </BackButtonWrapper>
          )}

          {isGroup ? (
            <GroupAvatar
              src={groupSummary?.avatarUrl}
              icon={!groupSummary?.avatarUrl ? <TeamOutlined /> : undefined}
            >
              {!groupSummary?.avatarUrl &&
                activeHeaderTitle.charAt(0).toUpperCase()}
            </GroupAvatar>
          ) : (
            <StyledAvatar src={peerDetails?.avatarUrl}>
              {!peerDetails?.avatarUrl &&
                activeHeaderTitle.charAt(0).toUpperCase()}
            </StyledAvatar>
          )}

          <HeaderMeta>
            <HeaderTitle>{activeHeaderTitle}</HeaderTitle>
            <StatusIndicator $isOnline={isGroup ? true : isPeerOnline}>
              {renderHeaderSubtitle()}
            </StatusIndicator>
          </HeaderMeta>
        </HeaderContent>
      </PaneHeader>

      {pinnedMessage && (
        <PinnedHeaderBanner>
          <PinnedHeaderContent>
            <PinnedIcon />
            <strong>Pinned:</strong> {pinnedMessage.text}
          </PinnedHeaderContent>
          <CloseIcon onClick={() => handleTogglePin(pinnedMessage)} />
        </PinnedHeaderBanner>
      )}

      <MessageTimeline ref={timelineContainerRef}>
        <TopSentinel ref={topSentinelRef} />

        {isLoadingMore && (
          <LoadingIndicator>
            <Spin size="small" /> Loading older messages...
          </LoadingIndicator>
        )}

        {isInitialLoading ? (
          <StateContainer>
            <Spin size="large" />
          </StateContainer>
        ) : hasLoadError ? (
          <StateContainer>
            <Empty
              image={<StyledWarningIcon />}
              description="Failed to load chat thread"
            />
          </StateContainer>
        ) : messages.length === 0 ? (
          <StateContainer>
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No messages here yet. Send a message to start the conversation!"
            />
          </StateContainer>
        ) : (
          messages.map((msg, index) => {
            const isGroupEventText =
              /left the group|joined the group|created the group|updated the group|changed group name/i.test(
                msg.text,
              ) ||
              /^(.*?)\s+(added|removed|promoted|demoted)\s+(.*?)$/i.test(
                msg.text,
              );

            const isSystemActionPattern =
              isGroupEventText && msg.text.length < 120 && !/\n/.test(msg.text);

            const rawType = msg.type?.toUpperCase();

            const isSystemMessage =
              rawType === "SYSTEM" ||
              rawType === "SYSTEM_MESSAGE" ||
              rawType === "SECURITY_ALERT" ||
              rawType === "ALERT" ||
              (msg as any).isSystem === true ||
              msg.user?.toUpperCase() === "SYSTEM" ||
              isSystemActionPattern;

            const normalizedSystemType =
              rawType === "SECURITY_ALERT"
                ? "SECURITY_ALERT"
                : rawType === "ALERT"
                  ? "ALERT"
                  : "SYSTEM";

            const currentDateLabel = formatSmartDate(msg.timeStamp);
            const previousMessage = messages[index - 1];
            const previousDateLabel = previousMessage
              ? formatSmartDate(previousMessage.timeStamp)
              : null;
            const showDateSeparator = currentDateLabel !== previousDateLabel;

            if (isSystemMessage) {
              return (
                <React.Fragment key={msg.id}>
                  {showDateSeparator && (
                    <DateSeparatorContainer>
                      <DateBadge>{currentDateLabel}</DateBadge>
                    </DateSeparatorContainer>
                  )}
                  <SystemMessageItem
                    text={msg.text}
                    type={normalizedSystemType as any}
                    timeStamp={msg.timeStamp}
                  />
                </React.Fragment>
              );
            }

            const isMe =
              (msg.user || "").toLowerCase() ===
              (user?.username || "").toLowerCase();
            const hasReactions = Boolean(
              msg.reactions && Object.keys(msg.reactions).length > 0,
            );

            const actionMenuItems: MenuProps["items"] = [
              {
                key: "reply",
                label: "Reply",
                icon: <RollbackOutlined />,
                onClick: () => {
                  setEditingMessage(null);
                  setReplyingTo(msg);
                },
              },
              {
                key: "copy",
                label: "Copy Text",
                icon: <CopyOutlined />,
                onClick: () => handleCopyText(msg.text),
              },
              {
                key: "pin",
                label: msg.isPinned ? "Unpin Message" : "Pin Message",
                icon: <PushpinOutlined />,
                onClick: () => handleTogglePin(msg),
              },
              {
                key: "info",
                label: "Message Info",
                icon: <InfoCircleOutlined />,
                onClick: () => setInfoModalMessage(msg),
              },
              ...(isMe
                ? [
                    {
                      key: "edit",
                      label: "Edit",
                      icon: <EditOutlined />,
                      onClick: () => {
                        setReplyingTo(null);
                        setEditingMessage(msg);
                        setTypedText(msg.text);
                      },
                    },
                    { type: "divider" as const },
                    {
                      key: "delete",
                      label: "Delete",
                      danger: true,
                      icon: <DeleteOutlined />,
                      onClick: () => handleDeleteMessage(msg.id),
                    },
                  ]
                : []),
            ];

            const emojiPopoverContent = (
              <QuickEmojiRow>
                {QUICK_EMOJIS.map((emoji) => (
                  <EmojiButton
                    key={emoji}
                    onClick={() => handleToggleReaction(msg.id, emoji)}
                  >
                    {emoji}
                  </EmojiButton>
                ))}
              </QuickEmojiRow>
            );

            return (
              <React.Fragment key={msg.id}>
                {showDateSeparator && (
                  <DateSeparatorContainer>
                    <DateBadge>{currentDateLabel}</DateBadge>
                  </DateSeparatorContainer>
                )}

                {msg.isBot ||
                msg.sender === "AetherBot" ||
                msg.user === "AetherBot" ? (
                  <BotMessage
                    key={msg.id || index}
                    messageId={msg.id}
                    content={msg.text}
                    timeStamp={msg.timeStamp}
                    fullMessage={msg}
                    onReply={(replyTargetMsg) => {
                      setReplyingTo(replyTargetMsg);
                    }}
                    onPin={(pinTargetMsg) => {
                      handleTogglePin(pinTargetMsg);
                    }}
                  />
                ) : (
                  <BubbleWrapper $isMe={isMe}>
                    <MessageActionWrapper $isMe={isMe}>
                      <Popover
                        content={emojiPopoverContent}
                        trigger="click"
                        placement="top"
                      >
                        <ActionButton type="text" icon={<SmileOutlined />} />
                      </Popover>

                      <Dropdown
                        menu={{ items: actionMenuItems }}
                        trigger={["click"]}
                        placement={isMe ? "bottomRight" : "bottomLeft"}
                      >
                        <ActionButton type="text" icon={<MoreOutlined />} />
                      </Dropdown>
                    </MessageActionWrapper>

                    <MessageBubble $isMe={isMe} $hasReactions={hasReactions}>
                      {msg.replyTo && (
                        <QuotedReplyBox $isMe={isMe}>
                          <QuotedUser>{msg.replyTo.user}</QuotedUser>
                          <QuotedText>{msg.replyTo.text}</QuotedText>
                        </QuotedReplyBox>
                      )}

                      {(!isMe || isGroup) && (
                        <SenderName>{msg.user}</SenderName>
                      )}
                      <MessageText>
                        {renderFormattedMessage(msg.text, isMe)}
                      </MessageText>

                      <TimestampWrapper>
                        {msg.isEdited && <EditedTag>(edited)</EditedTag>}
                        {formatTime12Hour(msg.timeStamp)}
                        {isMe && renderStatusTicks(msg.status)}
                      </TimestampWrapper>

                      {hasReactions && (
                        <ReactionsContainer $isMe={isMe}>
                          {Object.entries(msg.reactions!).map(
                            ([emoji, users]) => {
                              const hasReacted = users.includes(
                                user?.username || "Me",
                              );
                              return (
                                <ReactionBadge
                                  key={emoji}
                                  $hasReacted={hasReacted}
                                  onClick={() =>
                                    handleToggleReaction(msg.id, emoji)
                                  }
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </ReactionBadge>
                              );
                            },
                          )}
                        </ReactionsContainer>
                      )}
                    </MessageBubble>
                  </BubbleWrapper>
                )}
              </React.Fragment>
            );
          })
        )}

        <div ref={timelineEndRef} />
      </MessageTimeline>

      <TypingBanner>{typingUser && `${typingUser} is Typing...`}</TypingBanner>

      {replyingTo && (
        <ContextBanner>
          <ContextTextContainer>
            <ContextTitle>Replying to {replyingTo.user}</ContextTitle>
            <ContextSubtext>
              {replyingTo?.text
                ?.replace(/[\r\n]+/g, " ")
                ?.replace(/[*_#`~]/g, "")}
            </ContextSubtext>
          </ContextTextContainer>
          <CloseIcon onClick={() => setReplyingTo(null)} />
        </ContextBanner>
      )}

      {editingMessage && (
        <ContextBanner>
          <ContextTextContainer>
            <ContextTitle>Editing Message</ContextTitle>
            <ContextSubtext>{editingMessage.text}</ContextSubtext>
          </ContextTextContainer>
          <CloseIcon
            onClick={() => {
              setEditingMessage(null);
              setTypedText("");
            }}
          />
        </ContextBanner>
      )}

      <InputFooterContainer>
        {showMentionDropdown && filteredMentions.length > 0 && (
          <MentionDropdown>
            <MentionHeader>Suggestions</MentionHeader>
            {filteredMentions.map((item) => (
              <MentionItem
                key={item.id}
                onClick={() => handleSelectMention(item.username || item.name)}
              >
                <MentionBotIcon>{item.isBot ? "🤖" : "👤"}</MentionBotIcon>
                <MentionBotName>{item.name}</MentionBotName>
              </MentionItem>
            ))}
          </MentionDropdown>
        )}

        <StyledTextArea
          placeholder="Type a message or @ to mention someone..."
          value={typedText}
          onChange={(e) => {
            const val = e.target.value;
            setTypedText(val);

            const query = getMentionQuery(val);
            setShowMentionDropdown(query !== null);
          }}
          onKeyDown={handleKeyDown}
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={isInitialLoading || hasLoadError}
        />
        <SendButton
          type="primary"
          icon={<SendOutlined />}
          onClick={handleDispatch}
          disabled={isInitialLoading || hasLoadError || !typedText.trim()}
        />
      </InputFooterContainer>

      <Modal
        title="Message Info"
        open={Boolean(infoModalMessage)}
        onCancel={() => setInfoModalMessage(null)}
        footer={null}
      >
        {infoModalMessage && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Sender">
              {infoModalMessage.user}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              {infoModalMessage.status}
            </Descriptions.Item>
            <Descriptions.Item label="Sent At">
              {new Date(infoModalMessage.timeStamp).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Edited">
              {infoModalMessage.isEdited ? "Yes" : "No"}
            </Descriptions.Item>
            <Descriptions.Item label="Pinned">
              {infoModalMessage.isPinned ? "Yes" : "No"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {isGroup ? (
        <GroupInfoDrawer
          conversationId={conversationId}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onGroupLeftOrDeleted={() => {
            setIsDrawerOpen(false);
            if (onBack) onBack();
          }}
          onGroupUpdated={() => {
            fetchLatestMessages();
            axios
              .get(
                `http://localhost:8080/api/conversations/${conversationId}/group`,
                { withCredentials: true },
              )
              .then((res) => {
                if (res.data) {
                  setGroupSummary({
                    name: res.data.name || conversationName,
                    description: res.data.description,
                    avatarUrl:
                      res.data.avatarUrl ||
                      res.data.avatar_url ||
                      res.data.avatar ||
                      res.data.icon,
                    memberCount:
                      res.data.members?.length || res.data.memberCount || 0,
                  });
                  setCurrentHeaderTitle(res.data.name || conversationName);
                }
              })
              .catch((err) => {
                console.error("Failed to refresh group details:", err);
              });
          }}
        />
      ) : (
        <UserInfoDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          peerDetails={peerDetails}
          fallbackTitle={activeHeaderTitle}
          isPeerOnline={isPeerOnline}
        />
      )}
    </PaneContainer>
  );
};
