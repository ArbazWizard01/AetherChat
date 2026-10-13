import React, { useState, useEffect, useCallback } from "react";
import { Badge, Typography, Button, Avatar, Spin, Modal, message } from "antd";
import {
  MessageOutlined,
  TeamOutlined,
  LogoutOutlined,
  ThunderboltFilled,
  SettingOutlined,
  PlusOutlined,
  DeleteOutlined,
  UserAddOutlined,
  BellOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { formatTime12Hour, formatSmartDate } from "../utils/dateFormatter";

import { SearchUserModal } from "./SearchUserModal";
import { PendingRequests } from "./PendingRequests";
import { CreateGroupModal } from "./CreateGroupModal";

import {
  SidebarContainer,
  BrandHeader,
  BrandTitle,
  UserHeader,
  ProfileWrapper,
  UserMeta,
  HeaderActions,
  TabButtonGroup,
  TabButton,
  GroupActionWrapper,
  ListWrapper,
  StyledListItem,
  StyledGroupAvatar,
  ItemContentWrapper,
  ChatTitleRow,
  ChatSubtitleRow,
  TimeText,
  SubtitleText,
  StateContainer,
  UnreadBadge,
  DeleteChatBtn,
  HeaderBadge,
} from "./SidebarView.styles";

const { Text } = Typography;
type ChatTab = "messages" | "groups";

interface SidebarViewProps {
  selectedChatId: string | null;
  onSelectChat: (id: string | null, name: string, isGroup?: boolean) => void;
  onOpenProfile: () => void;
}

const getChatTitle = (item: any, currentUserId?: string): string => {
  if (item.name && item.name.trim() !== "") {
    return item.name;
  }

  const peer =
    item.peer || item.otherUser || item.recipient || item.user || item.receiver;
  if (peer) {
    if (peer.username) return peer.username;
    if (peer.name) return peer.name;
    if (peer.displayName) return peer.displayName;
    if (peer.email) return peer.email.split("@")[0];
  }

  const participants = item.participants || item.members || item.users;
  if (Array.isArray(participants) && participants.length > 0) {
    const otherMember =
      participants.find(
        (p: any) => (p.id || p._id || p.userId) !== currentUserId,
      ) || participants[0];

    if (otherMember) {
      return (
        otherMember.username ||
        otherMember.name ||
        otherMember.displayName ||
        otherMember.email?.split("@")[0] ||
        "Chat Partner"
      );
    }
  }

  return "Direct Message";
};

const getChatAvatar = (
  item: any,
  currentUserId?: string,
): string | undefined => {
  if (item.avatarUrl) return item.avatarUrl;

  const peer = item.peer || item.otherUser || item.recipient || item.user;
  if (peer?.avatarUrl) return peer.avatarUrl;

  const participants = item.participants || item.members;
  if (Array.isArray(participants)) {
    const otherMember = participants.find(
      (p: any) => (p.id || p._id || p.userId) !== currentUserId,
    );
    if (otherMember?.avatarUrl) return otherMember.avatarUrl;
  }

  return undefined;
};

export const SidebarView: React.FC<SidebarViewProps> = ({
  selectedChatId,
  onSelectChat,
  onOpenProfile,
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatTab>("messages");
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [isPendingModalOpen, setIsPendingModalOpen] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState<boolean>(false);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/conversations",
        { withCredentials: true },
      );
      const data: any[] = response.data || [];

      const synced = data.map((c) =>
        c.id === selectedChatId ? { ...c, unreadCount: 0 } : c,
      );
      setConversations(synced);
    } catch (err) {
      console.error("Failed to sync conversations from database.", err);
    }
  }, [selectedChatId]);

  const fetchPendingCount = useCallback(async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/contacts/pending",
        { withCredentials: true },
      );
      const incoming = response.data?.incoming || [];
      setPendingCount(incoming.length);
    } catch (err) {
      console.error("Failed to fetch pending requests count.", err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchConversations(), fetchPendingCount()]).finally(() =>
      setLoading(false),
    );
  }, [activeTab, fetchConversations, fetchPendingCount]);

  // AUTO-RESET: Clear selection if current user has no access to selectedChatId
  useEffect(() => {
    if (!loading && selectedChatId) {
      const exists = conversations.some((c) => c.id === selectedChatId);
      if (!exists) {
        onSelectChat(null, "");
      }
    }
  }, [conversations, selectedChatId, loading, onSelectChat]);

  const handleSelectChat = async (
    id: string,
    name: string,
    isGroup: boolean = false,
  ) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c)),
    );

    onSelectChat(id, name, isGroup);

    try {
      await axios.patch(
        `http://localhost:8080/api/conversations/${id}/read`,
        {},
        { withCredentials: true },
      );
    } catch (err) {
      console.error("Failed to mark messages as read", err);
    }
  };

  const handleDeleteConversation = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete Chat",
      content: "Are you sure you want to delete this chat thread?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await axios.delete(
            `http://localhost:8080/api/conversations/${chatId}`,
            { withCredentials: true },
          );
          message.success("Chat deleted successfully");
        } catch (err) {
          message.info("Chat removed locally");
        } finally {
          setConversations((prev) => prev.filter((c) => c.id !== chatId));
          if (selectedChatId === chatId) {
            onSelectChat(null, "");
          }
        }
      },
    });
  };

  const directMessages = conversations.filter((c) => !c.isGroup);
  const groupChats = conversations.filter((c) => c.isGroup);

  const totalUnreadMessages = directMessages.reduce(
    (sum, item) => sum + (item.unreadCount || 0),
    0,
  );
  const totalUnreadGroups = groupChats.reduce(
    (sum, item) => sum + (item.unreadCount || 0),
    0,
  );

  const renderRowTimestamp = (timeString?: string) => {
    if (!timeString) return "";
    const smartLabel = formatSmartDate(timeString);
    return smartLabel === "Today" ? formatTime12Hour(timeString) : smartLabel;
  };

  const usernameStr = typeof user?.username === "string" ? user.username : "";
  const avatarLetter = usernameStr ? usernameStr.charAt(0).toUpperCase() : "U";

  return (
    <SidebarContainer>
      <BrandHeader>
        <BrandTitle>
          <ThunderboltFilled style={{ color: "#1890ff" }} /> AetherChat
        </BrandTitle>
      </BrandHeader>

      <UserHeader>
        <ProfileWrapper onClick={onOpenProfile} title="View Profile">
          <Avatar src={user?.avatarUrl} style={{ backgroundColor: "#1890ff" }}>
            {!user?.avatarUrl && avatarLetter}
          </Avatar>
          <UserMeta>
            <Text strong>{usernameStr || "Aether User"}</Text>
          </UserMeta>
        </ProfileWrapper>

        <HeaderActions>
          <Button
            type="text"
            icon={<UserAddOutlined style={{ fontSize: "16px" }} />}
            onClick={() => setIsSearchModalOpen(true)}
            title="Search & Add Users"
          />

          <HeaderBadge count={pendingCount} size="small" offset={[-2, 4]}>
            <Button
              type="text"
              icon={<BellOutlined style={{ fontSize: "16px" }} />}
              onClick={() => setIsPendingModalOpen(true)}
              title="Pending Invitations"
            />
          </HeaderBadge>

          <Button
            type="text"
            icon={<SettingOutlined />}
            onClick={onOpenProfile}
            title="Profile Settings"
          />

          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={logout}
            danger
            title="Logout"
          />
        </HeaderActions>
      </UserHeader>

      <TabButtonGroup>
        <TabButton
          type={activeTab === "messages" ? "primary" : "default"}
          icon={<MessageOutlined />}
          $active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        >
          Messages
          {totalUnreadMessages > 0 && (
            <Badge
              count={totalUnreadMessages}
              style={{
                marginLeft: 8,
                backgroundColor: activeTab === "messages" ? "#fff" : "#ff4d4f",
                color: activeTab === "messages" ? "#1890ff" : "#fff",
              }}
            />
          )}
        </TabButton>
        <TabButton
          type={activeTab === "groups" ? "primary" : "default"}
          icon={<TeamOutlined />}
          $active={activeTab === "groups"}
          onClick={() => setActiveTab("groups")}
        >
          Groups
          {totalUnreadGroups > 0 && (
            <Badge
              count={totalUnreadGroups}
              style={{
                marginLeft: 8,
                backgroundColor: activeTab === "groups" ? "#fff" : "#ff4d4f",
                color: activeTab === "groups" ? "#1890ff" : "#fff",
              }}
            />
          )}
        </TabButton>
      </TabButtonGroup>

      {activeTab === "groups" && (
        <GroupActionWrapper>
          <Button
            type="dashed"
            block
            icon={<PlusOutlined />}
            onClick={() => setIsCreateGroupOpen(true)}
          >
            Create New Group
          </Button>
        </GroupActionWrapper>
      )}

      <ListWrapper>
        {loading ? (
          <StateContainer>
            <Spin />
          </StateContainer>
        ) : activeTab === "messages" ? (
          directMessages.length === 0 ? (
            <StateContainer>No messages found</StateContainer>
          ) : (
            directMessages.map((item) => {
              const chatTitle = getChatTitle(item, user?.id);
              const peerAvatar = getChatAvatar(item, user?.id);
              const itemInitial =
                chatTitle.length > 0 ? chatTitle.charAt(0).toUpperCase() : "C";

              return (
                <StyledListItem
                  key={item.id}
                  $active={item.id === selectedChatId}
                  onClick={() => handleSelectChat(item.id, chatTitle, false)}
                >
                  <Badge
                    dot
                    status={item.isOnline ? "success" : "default"}
                    offset={[-2, 32]}
                  >
                    <Avatar
                      src={peerAvatar}
                      style={{ backgroundColor: "#1890ff" }}
                    >
                      {!peerAvatar && itemInitial}
                    </Avatar>
                  </Badge>

                  <ItemContentWrapper>
                    <ChatTitleRow>
                      <Text strong style={{ maxWidth: "130px" }}>
                        {chatTitle}
                      </Text>
                      <TimeText>
                        {renderRowTimestamp(item.lastMessageTime)}
                      </TimeText>
                    </ChatTitleRow>
                    <ChatSubtitleRow>
                      <SubtitleText style={{ maxWidth: "140px" }}>
                        {item.lastMessageText || "Click to open chat..."}
                      </SubtitleText>
                      {item.unreadCount > 0 && (
                        <UnreadBadge count={item.unreadCount} size="small" />
                      )}
                    </ChatSubtitleRow>
                  </ItemContentWrapper>

                  <DeleteChatBtn
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => handleDeleteConversation(e, item.id)}
                  />
                </StyledListItem>
              );
            })
          )
        ) : groupChats.length === 0 ? (
          <StateContainer>No group chats found</StateContainer>
        ) : (
          groupChats.map((item) => {
            const chatTitle = getChatTitle(item, user?.id);
            const groupAvatar = getChatAvatar(item, user?.id);

            return (
              <StyledListItem
                key={item.id}
                $active={item.id === selectedChatId}
                onClick={() => handleSelectChat(item.id, chatTitle, true)}
              >
                <StyledGroupAvatar
                  src={groupAvatar}
                  icon={!groupAvatar && <TeamOutlined />}
                >
                  {!groupAvatar && chatTitle.charAt(0).toUpperCase()}
                </StyledGroupAvatar>

                <ItemContentWrapper>
                  <ChatTitleRow>
                    <Text strong style={{ maxWidth: "130px" }}>
                      {chatTitle}
                    </Text>
                    <TimeText>
                      {renderRowTimestamp(item.lastMessageTime)}
                    </TimeText>
                  </ChatTitleRow>
                  <ChatSubtitleRow>
                    <SubtitleText style={{ maxWidth: "140px" }}>
                      {item.lastMessageText || "Community chat..."}
                    </SubtitleText>
                    {item.unreadCount > 0 && (
                      <UnreadBadge count={item.unreadCount} size="small" />
                    )}
                  </ChatSubtitleRow>
                </ItemContentWrapper>

                <DeleteChatBtn
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => handleDeleteConversation(e, item.id)}
                />
              </StyledListItem>
            );
          })
        )}
      </ListWrapper>

      <SearchUserModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />

      <Modal
        title={null}
        footer={null}
        open={isPendingModalOpen}
        onCancel={() => setIsPendingModalOpen(false)}
        width={480}
        destroyOnHidden
        centered
      >
        <PendingRequests
          onContactAccepted={() => {
            fetchConversations();
            fetchPendingCount();
          }}
        />
      </Modal>

      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(newGroup) => {
          fetchConversations();
          if (newGroup?.id) {
            handleSelectChat(newGroup.id, newGroup.name || "New Group", true);
          }
        }}
      />
    </SidebarContainer>
  );
};
