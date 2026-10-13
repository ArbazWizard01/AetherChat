import React from "react";
import {
  SystemMessageContainer,
  SystemBadge,
  SecurityAlertBadge,
  AlertIcon,
  TimestampText,
} from "./SystemMessageItem.styles";

export type SystemMessageType = "SYSTEM" | "SECURITY_ALERT" | "ALERT";

export interface SystemMessageItemProps {
  text: string;
  type?: SystemMessageType;
  timeStamp?: string;
}

export const SystemMessageItem: React.FC<SystemMessageItemProps> = ({
  text,
  type = "SYSTEM",
  timeStamp,
}) => {
  const isAlert = type === "SECURITY_ALERT" || type === "ALERT";

  const formattedTime = timeStamp
    ? new Date(timeStamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  if (isAlert) {
    return (
      <SystemMessageContainer>
        <SecurityAlertBadge>
          <AlertIcon>⚠️</AlertIcon>
          <span>{text}</span>
          {formattedTime && <TimestampText>{formattedTime}</TimestampText>}
        </SecurityAlertBadge>
      </SystemMessageContainer>
    );
  }

  return (
    <SystemMessageContainer>
      <SystemBadge>
        <span>{text}</span>
        {formattedTime && <TimestampText>{formattedTime}</TimestampText>}
      </SystemBadge>
    </SystemMessageContainer>
  );
};
