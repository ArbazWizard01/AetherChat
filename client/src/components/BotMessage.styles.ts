import styled from "styled-components";

export const BotContainer = styled.div`
  position: relative;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin: 12px 0;
  max-width: 85%;
  min-width: 0; 
  box-sizing: border-box;

  @media (max-width: 768px) {
    max-width: 95%;
  }

  &:hover .bot-action-trigger {
    opacity: 1;
    visibility: visible;
  }
`;

export const BotCard = styled.div`
  position: relative;
  background: #ffffff;
  border-left: 3px solid #1677ff;
  border-radius: 0 12px 12px 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0; /* Ensures inner text clips correctly */
  word-break: break-word;
  overflow-wrap: anywhere;
  box-sizing: border-box;

  & * {
    max-width: 100%;
    overflow-wrap: anywhere;
  }

  pre {
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
`;

export const BotHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  padding-right: 48px; 
`;

export const BotTitle = styled.span`
  font-weight: 600;
  font-size: 13px;
  color: #1677ff;
`;

export const BotTimestamp = styled.span`
  font-size: 10px;
  color: #8c8c8c;
  white-space: nowrap;
`;

export const ActionTriggerWrapper = styled.div`
  position: absolute;
  top: 8px;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 2px;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 12px;
  padding: 2px 4px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.15s ease-in-out,
    visibility 0.15s ease-in-out;
  z-index: 5;
`;

export const IconActionButton = styled.button`
  background: transparent;
  border: none;
  cursor: pointer;
  color: #8c8c8c;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px 5px;
  border-radius: 4px;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    color: #1677ff;
    background-color: #f5f5f5;
  }
`;
