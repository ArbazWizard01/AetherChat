import styled from "styled-components";

export const SystemMessageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 12px 0;
  width: 100%;
`;

export const SystemBadge = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  color: #a0a0a0;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 14px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  text-align: center;
  letter-spacing: 0.2px;
  max-width: 80%;
  word-break: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const SecurityAlertBadge = styled(SystemBadge)`
  background-color: rgba(239, 68, 68, 0.12);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.25);
`;

export const AlertIcon = styled.span`
  font-size: 13px;
  line-height: 1;
`;

export const TimestampText = styled.span`
  font-size: 10px;
  color: #6c757d;
  margin-left: 4px;
`;
