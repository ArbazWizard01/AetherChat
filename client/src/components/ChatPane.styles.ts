import styled from "styled-components";
import { Avatar, Input, Button } from "antd";
import { CheckOutlined, PushpinFilled, CloseOutlined } from "@ant-design/icons";

export const StateContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 24px;
`;

export const SystemMessageWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0;
  width: 100%;
`;

export const SystemBadge = styled.span`
  background-color: rgba(255, 255, 255, 0.06);
  color: #a0a0a0;
  font-size: 12px;
  padding: 4px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  letter-spacing: 0.2px;
`;

export const SecurityAlertBadge = styled.span`
  background-color: rgba(239, 68, 68, 0.12);
  color: #f87171;
  font-size: 12px;
  padding: 5px 14px;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  text-align: center;
  font-weight: 500;
`;

export const PaneContainer = styled.div`
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f9fa;
  width: 100%;
  min-width: 0;
  overflow-x: hidden; /* Prevents viewport horizontal scrolling */

  @media (max-width: 768px) {
    height: 100dvh;
  }
`;

export const PaneHeader = styled.div`
  height: 64px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;

  @media (max-width: 768px) {
    padding: 0 12px;
    height: 56px;
  }
`;

export const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 0;
`;

export const HeaderMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

export const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: #262626;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StatusIndicator = styled.span<{ $isOnline: boolean }>`
  font-size: 11px;
  font-weight: ${(props) => (props.$isOnline ? "600" : "400")};
  color: ${(props) => (props.$isOnline ? "#52c41a" : "#8c8c8c")};
`;

export const StyledAvatar = styled(Avatar)`
  background-color: #87d068;
  flex-shrink: 0;
`;

export const GroupAvatar = styled(Avatar)`
  background-color: #722ed1;
  flex-shrink: 0;
`;

export const BackButtonWrapper = styled.div`
  display: none;
  margin-right: 8px;
  cursor: pointer;
  font-size: 18px;
  color: #595959;
  flex-shrink: 0;

  @media (max-width: 768px) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

export const PinnedHeaderBanner = styled.div`
  background: #e6f7ff;
  border-bottom: 1px solid #91d5ff;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #0050b3;
  min-width: 0;
`;

export const PinnedHeaderContent = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  min-width: 0;
  flex: 1;
`;

export const PinnedIcon = styled(PushpinFilled)`
  margin-right: 6px;
  flex-shrink: 0;
`;

export const CloseIcon = styled(CloseOutlined)`
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 8px;
  transition: color 0.15s ease;

  &:hover {
    color: #ff4d4f;
  }
`;

export const MessageTimeline = styled.div`
  flex: 1;
  padding: 20px 24px;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 12px 10px;
    gap: 8px;
  }
`;

export const TopSentinel = styled.div`
  height: 1px;
  width: 100%;
`;

export const LoadingIndicator = styled.div`
  text-align: center;
  padding: 6px 0;
  color: #8c8c8c;
  font-size: 12px;
`;

export const DateSeparatorContainer = styled.div`
  display: flex;
  justify-content: center;
  margin: 10px 0;
`;

export const DateBadge = styled.span`
  background: #dfe5e8;
  color: #4a5568;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
`;

export const MessageActionWrapper = styled.div<{ $isMe?: boolean }>`
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 2px;
  order: ${(props) => (props.$isMe ? 1 : 2)};
  flex-shrink: 0;
`;

export const ActionButton = styled(Button)`
  padding: 0;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  box-shadow: none;
  color: #8c8c8c;

  &:hover {
    color: #262626;
    background: #e6f7ff;
    border-radius: 50%;
  }
`;

export const BubbleWrapper = styled.div<{ $isMe: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: ${(props) => (props.$isMe ? "flex-end" : "flex-start")};
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;

  &:hover ${MessageActionWrapper} {
    opacity: 1;
  }
`;

export const MessageBubble = styled.div<{
  $isMe: boolean;
  $hasReactions?: boolean;
}>`
  max-width: 75%;
  padding: 10px 14px;
  border-radius: 12px;
  background: ${(props) => (props.$isMe ? "#1890ff" : "#ffffff")};
  color: ${(props) => (props.$isMe ? "#ffffff" : "#000000")};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  word-break: break-word;
  overflow-wrap: anywhere;
  min-width: 0;
  order: ${(props) => (props.$isMe ? 2 : 1)};
  margin-bottom: ${(props) => (props.$hasReactions ? "10px" : "0px")};
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 85%;
    padding: 8px 12px;
  }
`;

export const QuotedReplyBox = styled.div<{ $isMe?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 10px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: ${(props) =>
    props.$isMe ? "rgba(0, 0, 0, 0.15)" : "rgba(0, 0, 0, 0.06)"};
  border-left: 4px solid ${(props) => (props.$isMe ? "#ffffff" : "#1677ff")};
  cursor: pointer;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) =>
      props.$isMe ? "rgba(0, 0, 0, 0.22)" : "rgba(0, 0, 0, 0.1)"};
  }
`;

export const QuotedUser = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: #25d366;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`;

/* FIXED: Replaced white-space: nowrap with a 2-line WebKit clamp */
export const QuotedText = styled.div`
  font-size: 12px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.35;
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: anywhere;

  /* Ensures child markdown tags don't override layout */
  p,
  div,
  span {
    display: inline;
    margin: 0;
  }
`;

export const SenderName = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  margin-bottom: 4px;
`;

export const MessageText = styled.div`
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
`;

export const ReactionsContainer = styled.div<{ $isMe: boolean }>`
  position: absolute;
  bottom: -10px;
  ${(props) => (props.$isMe ? "right: 10px;" : "left: 10px;")}
  display: flex;
  align-items: center;
  gap: 3px;
  z-index: 2;
`;

export const ReactionBadge = styled.span<{ $hasReacted?: boolean }>`
  background: #ffffff;
  border: 1px solid ${(props) => (props.$hasReacted ? "#1890ff" : "#e8e8e8")};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.12);
  border-radius: 12px;
  padding: 1px 6px;
  font-size: 11px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #262626;

  &:hover {
    transform: scale(1.08);
    transition: transform 0.15s ease-in-out;
  }
`;

export const TimestampWrapper = styled.div`
  font-size: 10px;
  align-self: flex-end;
  margin-top: 4px;
  opacity: 0.85;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 12px;
`;

export const EditedTag = styled.span`
  font-size: 9px;
  font-style: italic;
  opacity: 0.75;
`;

export const FailedTick = styled.span`
  color: #ff4d4f;
  font-size: 10px;
  font-weight: bold;
  margin-left: 6px;
`;

export const SingleTick = styled(CheckOutlined)`
  color: rgba(255, 255, 255, 0.7);
  font-size: 11px;
  margin-left: 5px;
`;

export const DoubleTickWrapper = styled.span`
  margin-left: 5px;
  display: inline-flex;
  align-items: center;
`;

export const DoubleTick = styled(CheckOutlined)<{
  $isRead?: boolean;
  $isSecond?: boolean;
}>`
  color: ${(props) => (props.$isRead ? "#00e5ff" : "rgba(255, 255, 255, 0.7)")};
  font-size: 11px;
  ${(props) => props.$isSecond && "margin-left: -6px;"}
`;

export const TypingBanner = styled.div`
  padding: 0 24px 6px 24px;
  height: 20px;
  font-style: italic;
  color: #8c8c8c;
  font-size: 12px;

  @media (max-width: 768px) {
    padding: 0 12px 4px 12px;
    font-size: 11px;
  }
`;

export const ContextBanner = styled.div`
  background: #f5f5f5;
  border-top: 1px solid #e8e8e8;
  padding: 8px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    padding: 8px 12px;
  }
`;

export const ContextTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  font-size: 12px;
  overflow: hidden;
  min-width: 0;
  width: 0;
  flex: 1;
`;

export const ContextTitle = styled.span`
  font-weight: 600;
  color: #1890ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`;

export const ContextSubtext = styled.div`
  color: #595959;
  font-size: 12px;
  line-height: 1.35;
  max-width: 100%;
  min-width: 0;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: anywhere;
`;

export const InputFooter = styled.div`
  padding: 14px 24px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  align-items: center;

  @media (max-width: 768px) {
    padding: 10px 12px;
    gap: 8px;
  }
`;

export const StyledTextArea = styled(Input.TextArea)`
  resize: none;
  border-radius: 8px;
  padding: 8px 12px;
`;

export const SendButton = styled(Button)`
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

export const QuickEmojiRow = styled.div`
  display: flex;
  gap: 6px;
  padding: 4px;
`;

export const EmojiButton = styled.button`
  background: transparent;
  border: none;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;

  &:hover {
    background: #f0f0f0;
  }
`;

export const DrawerProfileHeader = styled.div`
  text-align: center;
  padding-bottom: 20px;
`;

export const DrawerAvatar = styled(Avatar)`
  background-color: #1890ff;
  margin-bottom: 12px;
`;

export const DrawerUsername = styled.h2`
  margin: 4px 0;
`;

export const DrawerEmail = styled.div`
  color: #8c8c8c;
  font-size: 13px;
  margin-bottom: 8px;
`;

export const DrawerSectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const DrawerSectionTitle = styled.h4`
  color: #8c8c8c;
  margin-bottom: 4px;
`;

export const DrawerBioText = styled.p`
  margin: 0;
`;

export const DrawerLinksSectionTitle = styled.h4`
  color: #8c8c8c;
  margin-bottom: 8px;
`;

export const DrawerLinksContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DrawerEmptyLinksText = styled.span`
  color: #bfbfbf;
  font-size: 13px;
`;

export const InputFooterContainer = styled(InputFooter)`
  position: relative;
`;

export const MentionDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  left: 24px;
  width: 220px;
  max-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  margin-bottom: 8px;
  z-index: 1000;

  @media (max-width: 768px) {
    left: 12px;
  }
`;

export const MentionHeader = styled.div`
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
`;

export const MentionItem = styled.div`
  padding: 10px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #262626;
  transition: background 0.15s ease-in-out;

  &:hover {
    background: #f5f5f5;
  }

  &:last-child {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
`;

export const MentionBotIcon = styled.span`
  font-size: 16px;
  display: flex;
  align-items: center;
`;

export const MentionBotName = styled.strong`
  font-weight: 600;
  color: #1677ff;
`;

export const PreviewText = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  font-size: 12px;
  color: #595959;
  display: block;
`;
