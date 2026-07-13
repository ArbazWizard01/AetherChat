import React, { useState, useEffect } from "react";
import { Badge, Typography, List, Button, Avatar } from "antd";
import {
  MessageOutlined,
  TeamOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import axios from "axios";
import { useAuth } from "../context/AuthContext.js";
import { formatTime12Hour, formatSmartDate } from "../utils/dateFormatter.js";

import {
  SidebarContainer,
  UserHeader,
  ProfileWrapper,
  TabButtonGroup,
  TabButton,
  ListWrapper,
  StyledListItem,
  StyledUserAvatar,
  StyledGroupAvatar,
} from "./SidebarView.styles.js";

const { Text } = Typography;
type ChatTab = "messages" | "groups";

interface SidebarConversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  isOnline: boolean;
  unreadCount: number;
  lastMessageTime: string;
}

interface SidebarViewProps {
  selectedChatId: string | null;
  onSelectChat: (id: string, name: string) => void;
}

export const SidebarView: React.FC<SidebarViewProps> = ({
  selectedChatId,
  onSelectChat,
}) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ChatTab>("messages");
  const [conversations, setConversations] = useState<SidebarConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchConversations = async () => {
    try {
      const response = await axios.get(
        "http://localhost:8080/api/conversations",
      );
      setConversations(response.data);
    } catch (err: any) {
      console.error("Failed to sync conversation streams from database.");
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchConversations().finally(() => setLoading(false));
  }, [activeTab, selectedChatId]);

  const directMessages = conversations.filter((c) => !c.isGroup);
  const groupChats = conversations.filter((c) => c.isGroup);

  const renderRowTimestamp = (timeString: string) => {
    const smartLabel = formatSmartDate(timeString);
    return smartLabel === "Today" ? formatTime12Hour(timeString) : smartLabel;
  };

  return (
    <SidebarContainer>
      <UserHeader>
        <ProfileWrapper>
          <StyledUserAvatar>
            {(user?.username || "U").charAt(0).toUpperCase()}
          </StyledUserAvatar>
          <Text strong>{user?.username || "Aether User"}</Text>
        </ProfileWrapper>
        <Button type="text" icon={<LogoutOutlined />} onClick={logout} danger />
      </UserHeader>

      <TabButtonGroup>
        <TabButton
          type={activeTab === "messages" ? "primary" : "default"}
          icon={<MessageOutlined />}
          $active={activeTab === "messages"}
          onClick={() => setActiveTab("messages")}
        >
          Messages
        </TabButton>
        <TabButton
          type={activeTab === "groups" ? "primary" : "default"}
          icon={<TeamOutlined />}
          $active={activeTab === "groups"}
          onClick={() => setActiveTab("groups")}
        >
          Groups
        </TabButton>
      </TabButtonGroup>

      <ListWrapper>
        {activeTab === "messages" ? (
          <List
            itemLayout="horizontal"
            loading={loading}
            dataSource={directMessages}
            renderItem={(item: SidebarConversation) => {
              const chatTitle = item.name || "Private Thread";
              return (
                <StyledListItem
                  $active={item.id === selectedChatId}
                  onClick={() => onSelectChat(item.id, chatTitle)}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge
                        dot
                        status={item.isOnline ? "success" : "default"}
                        offset={[-2, 32]}
                      >
                        <Avatar>{chatTitle.charAt(0).toUpperCase()}</Avatar>
                      </Badge>
                    }
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Text strong>{chatTitle}</Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: "11px", fontWeight: "normal" }}
                        >
                          {renderRowTimestamp(item.lastMessageTime)}
                        </Text>
                      </div>
                    }
                    description={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Click to open encrypted chat timeline...
                        </Text>
                        {item.unreadCount > 0 && (
                          <Badge
                            count={item.unreadCount}
                            size="small"
                            style={{ backgroundColor: "#52c41a" }}
                          />
                        )}
                      </div>
                    }
                  />
                </StyledListItem>
              );
            }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            loading={loading}
            dataSource={groupChats}
            renderItem={(item: SidebarConversation) => {
              const chatTitle = item.name || "Unnamed Room Space";
              return (
                <StyledListItem
                  $active={item.id === selectedChatId}
                  onClick={() => onSelectChat(item.id, chatTitle)}
                >
                  <List.Item.Meta
                    avatar={<StyledGroupAvatar icon={<TeamOutlined />} />}
                    title={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          width: "100%",
                        }}
                      >
                        <Text strong>{chatTitle}</Text>
                        <Text
                          type="secondary"
                          style={{ fontSize: "11px", fontWeight: "normal" }}
                        >
                          {renderRowTimestamp(item.lastMessageTime)}
                        </Text>
                      </div>
                    }
                    description={
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                        }}
                      >
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Click to enter community chat stream...
                        </Text>
                        {item.unreadCount > 0 && (
                          <Badge
                            count={item.unreadCount}
                            size="small"
                            style={{ backgroundColor: "#52c41a" }}
                          />
                        )}
                      </div>
                    }
                  />
                </StyledListItem>
              );
            }}
          />
        )}
      </ListWrapper>
    </SidebarContainer>
  );
};
