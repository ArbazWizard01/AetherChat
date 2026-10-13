import styled from "styled-components";
import { Avatar, Button, Badge } from "antd";

export const SidebarContainer = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-right: 1px solid #f0f0f0;

  @media (max-width: 768px) {
    height: 100dvh;
    border-right: none;
  }
`;

export const BrandHeader = styled.div`
  height: 64px;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
`;

export const BrandTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f1f1f;
  letter-spacing: -0.3px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const UserHeader = styled.div`
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fafafa;
`;

export const ProfileWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: #eaeaea;
  }
`;

export const UserMeta = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledUserAvatar = styled(Avatar)`
  background-color: #1890ff;
`;

export const StyledGroupAvatar = styled(Avatar)`
  background-color: #722ed1;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
`;

export const HeaderBadge = styled(Badge)`
  .ant-badge-count {
    box-shadow: 0 0 0 1px #ffffff;
  }
`;

export const TabButtonGroup = styled.div`
  display: flex;
  padding: 12px 16px;
  gap: 8px;
  border-bottom: 1px solid #f0f0f0;
`;

export const TabButton = styled(Button)<{ $active?: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* Updated padding and added margin-bottom for clear separation from group list */
export const GroupActionWrapper = styled.div`
  padding: 12px 16px;
  margin-bottom: 4px;
`;

export const ListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const DeleteChatBtn = styled(Button)`
  opacity: 0;
  transition: opacity 0.2s ease;
`;

export const StyledListItem = styled.div<{ $active?: boolean }>`
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: ${(props) => (props.$active ? "#e6f7ff" : "transparent")};
  transition: background 0.2s ease;

  &:hover {
    background: ${(props) => (props.$active ? "#e6f7ff" : "#f5f5f5")};

    ${DeleteChatBtn} {
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    padding: 14px 12px;
  }
`;

export const ItemContentWrapper = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ChatTitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ChatSubtitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const TimeText = styled.span`
  font-size: 11px;
  color: #8c8c8c;
  white-space: nowrap;
  margin-left: 8px;
`;

export const SubtitleText = styled.span`
  font-size: 12px;
  color: #8c8c8c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StateContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8c8c8c;
  font-size: 14px;
`;

export const UnreadBadge = styled(Badge)`
  margin-left: 8px;
`;
