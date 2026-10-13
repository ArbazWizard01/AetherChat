import styled from "styled-components";
import { Avatar, Select, Tag, Button, List } from "antd";
import { CameraOutlined } from "@ant-design/icons";

export const DrawerHeader = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;
  padding-bottom: 20px;
`;

export const GroupAvatar = styled(Avatar)`
  background-color: #1677ff;
  font-size: 36px;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.2);
`;

export const DrawerTitle = styled.h2`
  margin: 4px 0 0 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f1f1f;
  word-break: break-word;
`;

export const GroupBio = styled.p`
  margin: 0;
  color: #666666;
  font-size: 13px;
  line-height: 1.4;
  word-break: break-word;
`;

export const MemberCountTag = styled(Tag)`
  border-radius: 12px;
  padding: 2px 10px;
  font-weight: 500;
  margin-top: 4px;
`;

export const EditTriggerButton = styled(Button)`
  margin-top: 6px;
  border-radius: 6px;
`;

export const SectionDivider = styled.hr`
  border: none;
  border-top: 1px solid #f0f0f0;
  margin: 16px 0;
`;

export const EditSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  margin-bottom: 16px;
`;

export const ButtonRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 4px;
`;

export const MembersHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const MembersTitle = styled.span`
  font-weight: 600;
  font-size: 14px;
  color: #262626;
`;

export const MemberItem = styled(List.Item)`
  padding: 10px 0 !important;
  border-bottom: 1px solid #f5f5f5 !important;
`;

export const MemberNameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
`;

export const AdminTag = styled(Tag)`
  margin-left: 2px;
  font-size: 10px;
  line-height: 16px;
  border-radius: 4px;
`;

export const PromoteIconButton = styled(Button)`
  color: #faad14 !important;
  &:hover {
    color: #d48806 !important;
    background-color: #fffbe6 !important;
  }
`;

export const EmailText = styled.span`
  color: #8c8c8c;
  font-size: 12px;
`;

export const DrawerFooter = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;

export const Label = styled.label`
  display: block;
  font-weight: 500;
  font-size: 13px;
  color: #262626;
  margin-bottom: 4px;
`;

export const UserSelect = styled(Select)`
  width: 100%;
`;

export const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px 0;
`;

export const ErrorContainer = styled.div`
  padding: 40px 0;
  text-align: center;
`;

export const AvatarUploadWrapper = styled.div`
  position: relative;
  cursor: pointer;
  display: inline-block;
  border-radius: 50%;
  overflow: hidden;
`;

export const CameraOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
`;

export const CameraIconWrapper = styled(CameraOutlined)`
  font-size: 20px;
  margin-bottom: 2px;
`;
