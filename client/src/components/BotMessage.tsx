import React, { useState } from "react";
import { Avatar, Dropdown, type MenuProps, message } from "antd";
import {
  RobotOutlined,
  MoreOutlined,
  SmileOutlined,
  RollbackOutlined,
  CopyOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import { MarkdownContent } from "./MarkdownContent.js";
import {
  BotContainer,
  BotCard,
  BotHeader,
  BotTitle,
  BotTimestamp,
  ActionTriggerWrapper,
  IconActionButton,
} from "./BotMessage.styles.js";

interface BotMessageProps {
  content: string;
  timeStamp?: string | number | Date;
  messageId?: string;
  fullMessage?: any;
  onReply?: (msg: any) => void;
  onCopy?: (text: string) => void;
  onPin?: (msg: any) => void;
}

export const BotMessage: React.FC<BotMessageProps> = ({
  content,
  timeStamp,
  messageId,
  fullMessage,
  onReply,
  onCopy,
  onPin,
}) => {
  const [copied, setCopied] = useState(false);

  const formattedTime = timeStamp
    ? new Date(timeStamp)
        .toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase()
    : "";

  const targetMessage = fullMessage || {
    id: messageId,
    sender: "AetherBot",
    user: "AetherBot",
    text: content,
    timeStamp: timeStamp || new Date(),
    isBot: true,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    message.success("Copied to clipboard");
    if (onCopy) onCopy(content);
    setTimeout(() => setCopied(false), 2000);
  };

  const menuItems: MenuProps["items"] = [
    {
      key: "reply",
      label: "Reply",
      icon: <RollbackOutlined />,
      onClick: () => onReply?.(targetMessage),
    },
    {
      key: "copy",
      label: copied ? "Copied" : "Copy Text",
      icon: <CopyOutlined />,
      onClick: handleCopy,
    },
    {
      key: "pin",
      label: "Pin Message",
      icon: <PushpinOutlined />,
      onClick: () => onPin?.(targetMessage),
    },
  ];

  return (
    <BotContainer>
      <Avatar
        style={{ backgroundColor: "#1677ff", flexShrink: 0 }}
        icon={<RobotOutlined />}
      />

      <BotCard>
        <BotHeader>
          <BotTitle>AetherBot</BotTitle>
          {formattedTime && <BotTimestamp>{formattedTime}</BotTimestamp>}
        </BotHeader>

        <MarkdownContent content={content} />

        <ActionTriggerWrapper className="bot-action-trigger">
          <IconActionButton title="Add reaction">
            <SmileOutlined />
          </IconActionButton>

          <Dropdown
            menu={{ items: menuItems }}
            trigger={["click"]}
            placement="bottomRight"
          >
            <IconActionButton title="More actions">
              <MoreOutlined />
            </IconActionButton>
          </Dropdown>
        </ActionTriggerWrapper>
      </BotCard>
    </BotContainer>
  );
};
