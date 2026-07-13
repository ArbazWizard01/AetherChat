import styled from "styled-components";
import { Button, List, Avatar } from "antd";

export const SidebarContainer = styled.div`
  width: 350px;
  height: 100vh;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
`;

export const UserHeader = styled.div`
  padding: 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ProfileWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const TabButtonGroup = styled.div`
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
`;

export const TabButton = styled(Button)<{ $active: boolean }>`
  flex: 1;
`;

export const ListWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const StyledListItem = styled(List.Item)<{ $active?: boolean }>`
  && {
    padding: 12px 16px;
    cursor: pointer;
    transition: all 0.2s ease;
    background: ${(props) => (props.$active ? "#e6f7ff" : "#ffffff")};
    border-left: ${(props) => (props.$active ? "4px solid #1890ff" : "4px solid transparent")};

    &:hover {
      background: ${(props) => (props.$active ? "#e6f7ff" : "#f5f5f5")};
    }
  }
`;

export const StyledUserAvatar = styled(Avatar)`
  && {
    background-color: #1890ff;
  }
`;

export const StyledGroupAvatar = styled(Avatar)`
  && {
    background-color: #87d068;
  }
`;