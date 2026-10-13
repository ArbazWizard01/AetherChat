import styled, { keyframes } from "styled-components";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
`;

export const ModalContainer = styled.div`
  width: 100%;
  max-width: 480px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow: hidden;
  margin: 16px;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
`;

export const ModalTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
`;

export const CloseButton = styled.button`
  border: none;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
    color: #1f1f1f;
  }
`;

export const SearchSection = styled.div`
  padding: 16px 20px;
  background-color: #fafafa;
  border-bottom: 1px solid #f0f0f0;
`;

export const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 12px;
    color: #8c8c8c;
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 36px 0 38px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  color: #1f1f1f;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    border-color: #1890ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.15);
  }
`;

export const ClearSearchButton = styled.button`
  position: absolute;
  right: 10px;
  border: none;
  background: transparent;
  color: #8c8c8c;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #434343;
  }
`;

export const ResultsSection = styled.div`
  flex: 1;
  min-height: 260px;
  max-height: 380px;
  overflow-y: auto;
  padding: 12px 20px;
`;

export const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const UserCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #fafafa;
  }
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export const AvatarWrapper = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
`;

export const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

export const AvatarFallback = styled.div`
  width: 100%;
  height: 100%;
  background-color: #1890ff;
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Username = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: #1f1f1f;
`;

export const UserEmail = styled.span`
  font-size: 12px;
  color: #8c8c8c;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 14px;
  background-color: #1890ff;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover:not(:disabled) {
    background-color: #096dd9;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;

export const StatusBadge = styled.div<{ $type: "friend" | "pending" | "sent" }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;

  ${(props) =>
    props.$type === "friend" &&
    `
    background-color: #e6f7ff;
    color: #1890ff;
  `}

  ${(props) =>
    props.$type === "pending" &&
    `
    background-color: #fff7e6;
    color: #fa8c16;
  `}

  ${(props) =>
    props.$type === "sent" &&
    `
    background-color: #f6ffed;
    color: #52c41a;
  `}
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  gap: 12px;
  color: #bfbfbf;
  font-size: 14px;

  .spinner {
    animation: ${spin} 1s linear infinite;
    color: #1890ff;
  }
`;