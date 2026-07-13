import styled from "styled-components";

export const PaneContainer = styled.div`
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f9fa;
`;

export const PaneHeader = styled.div`
  height: 64px;
  padding: 0 24px;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const HeaderMeta = styled.div`
  display: flex;
  flex-direction: column;
`;

export const MessageTimeline = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const BubbleWrapper = styled.div<{ $isMe: boolean }>`
  display: flex;
  justify-content: ${(props) => (props.$isMe ? "flex-end" : "flex-start")};
`;

export const MessageBubble = styled.div<{ $isMe: boolean }>`
  max-width: 60%;
  padding: 10px 14px;
  border-radius: 8px;
  background: ${(props) => (props.$isMe ? "#1890ff" : "#ffffff")};
  color: ${(props) => (props.$isMe ? "#ffffff" : "#000000")};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  position: relative;
`;

export const SenderName = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #8c8c8c;
  margin-bottom: 4px;
`;

export const TimestampWrapper = styled.div`
  font-size: 10px;
  align-self: flex-end;
  margin-top: 4px;
  opacity: 0.85;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding-left: 12px;
`;

export const TypingBanner = styled.div`
  padding: 0 24px 8px 24px;
  height: 20px;
  font-style: italic;
  color: #8c8c8c;
  font-size: 12px;
`;

export const InputFooter = styled.div`
  padding: 16px 24px;
  background: #ffffff;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  align-items: center;
`;
