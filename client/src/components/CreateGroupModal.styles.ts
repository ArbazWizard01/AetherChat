import styled from "styled-components";
import { Select } from "antd";

export const CreateGroupButtonWrapper = styled.div`
  margin-bottom: 16px;
`;

export const GroupListWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

export const TitleIconWrapper = styled.span`
  margin-right: 8px;
  color: #1890ff;
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 16px;
`;

export const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

export const Label = styled.label`
  font-weight: 500;
  color: #262626;
`;

export const MemberSelect = styled(Select)`
  width: 100%;
`;
