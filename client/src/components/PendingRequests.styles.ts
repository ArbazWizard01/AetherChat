import styled, { keyframes } from "styled-components";

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
`;

export const Header = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Title = styled.h3`
  font-size: 15px;
  font-weight: 600;
  color: #1f1f1f;
  margin: 0;
`;

export const TabGroup = styled.div`
  display: flex;
  background-color: #f5f5f5;
  padding: 3px;
  border-radius: 8px;
  gap: 2px;
`;

export const TabButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(props) => (props.$active ? "#ffffff" : "transparent")};
  color: ${(props) => (props.$active ? "#1f1f1f" : "#8c8c8c")};
  font-weight: ${(props) => (props.$active ? "600" : "500")};
  font-size: 13px;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  box-shadow: ${(props) =>
    props.$active ? "0 1px 3px rgba(0,0,0,0.08)" : "none"};
  transition: all 0.2s ease;
`;

export const Badge = styled.span<{ $variant?: "secondary" }>`
  background-color: ${(props) =>
    props.$variant === "secondary" ? "#8c8c8c" : "#ff4d4f"};
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
`;

export const ContentArea = styled.div`
  padding: 16px;
  min-height: 220px;
  max-height: 360px;
  overflow-y: auto;
`;

export const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const RequestCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
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
  width: 36px;
  height: 36px;
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
  font-size: 14px;
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

export const Timestamp = styled.span`
  font-size: 11px;
  color: #8c8c8c;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const IconButton = styled.button<{ $variant: "accept" | "decline" }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) =>
    props.$variant === "accept" &&
    `
    background-color: #52c41a;
    color: #ffffff;
    &:hover:not(:disabled) { background-color: #389e0d; }
  `}

  ${(props) =>
    props.$variant === "decline" &&
    `
    background-color: #fff1f0;
    color: #ff4d4f;
    border: 1px solid #ffa39e;
    &:hover:not(:disabled) { background-color: #ffccc7; }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    animation: ${spin} 1s linear infinite;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 180px;
  gap: 10px;
  color: #bfbfbf;
  font-size: 13px;

  .spinner {
    animation: ${spin} 1s linear infinite;
    color: #1890ff;
  }
`;
