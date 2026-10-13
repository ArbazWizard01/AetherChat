import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  Drawer,
  Avatar,
  List,
  Button,
  Popconfirm,
  message,
  Modal,
  Input,
  Tooltip,
  Spin,
  Empty,
  Upload,
} from "antd";
import {
  UserOutlined,
  CrownOutlined,
  UserDeleteOutlined,
  LogoutOutlined,
  UserAddOutlined,
  TeamOutlined,
  EditOutlined,
  SaveOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import axios from "axios";
import debounce from "lodash/debounce";

import {
  DrawerHeader,
  GroupAvatar,
  DrawerTitle,
  GroupBio,
  MembersHeader,
  MembersTitle,
  MemberNameWrapper,
  AdminTag,
  MemberCountTag,
  PromoteIconButton,
  EmailText,
  DrawerFooter,
  ModalBody,
  Label,
  UserSelect,
  EditSection,
  ButtonRow,
  EditTriggerButton,
  MemberItem,
  SectionDivider,
  LoadingContainer,
  ErrorContainer,
  AvatarUploadWrapper,
  CameraOverlay,
  CameraIconWrapper,
} from "./GroupInfoDrawer.styles";

const BASE_URL = "http://localhost:8080/api";

const getDevConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    withCredentials: true,
  };
};

interface GroupMember {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  isOnline?: boolean;
  isAdmin: boolean;
}

interface GroupData {
  name: string;
  description?: string;
  avatarUrl?: string;
  amIAdmin: boolean;
  members: GroupMember[];
}

interface SearchUser {
  id?: string;
  _id?: string;
  username?: string;
  name?: string;
  email?: string;
}

interface GroupDrawerProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
  onGroupLeftOrDeleted: () => void;
  onGroupUpdated?: () => void;
}

export const GroupInfoDrawer: React.FC<GroupDrawerProps> = ({
  conversationId,
  isOpen,
  onClose,
  onGroupLeftOrDeleted,
  onGroupUpdated,
}) => {
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>("");
  const [editBio, setEditBio] = useState<string>("");
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>("");
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [addLoading, setAddLoading] = useState<boolean>(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchGroupDetails = useCallback(async () => {
    if (!conversationId) return;
    setLoading(true);
    setFetchError(false);
    try {
      const res = await axios.get(
        `${BASE_URL}/conversations/${conversationId}/group`,
        getDevConfig(),
      );
      const raw = res.data?.group || res.data || {};
      const rawMembers = raw.members || raw.participants || [];

      const normalizedMembers: GroupMember[] = rawMembers.map((m: any) => ({
        id: m.id || m._id,
        username: m.username || m.name || m.email?.split("@")[0] || "User",
        email: m.email || "",
        avatarUrl: m.avatarUrl,
        isOnline: m.isOnline ?? false,
        isAdmin: Boolean(
          m.isAdmin || m.role === "ADMIN" || (m.id || m._id) === raw.adminId,
        ),
      }));

      const normalizedGroup: GroupData = {
        name: raw.name || "Group Chat",
        description: raw.description || "",
        avatarUrl: raw.avatarUrl || "",
        amIAdmin: Boolean(raw.amIAdmin || raw.isAdmin),
        members: normalizedMembers,
      };

      setGroupData(normalizedGroup);
      setEditName(normalizedGroup.name);
      setEditBio(normalizedGroup.description || "");
      setEditAvatarUrl(normalizedGroup.avatarUrl || "");
    } catch (err: unknown) {
      console.error("Failed to load group info:", err);
      setFetchError(true);
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message.error(err.response.data.error);
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (isOpen && conversationId) {
      fetchGroupDetails();
    } else {
      setIsEditing(false);
    }
  }, [isOpen, conversationId, fetchGroupDetails]);

  const handleStartEditing = () => {
    if (groupData) {
      setEditName(groupData.name);
      setEditBio(groupData.description || "");
      setEditAvatarUrl(groupData.avatarUrl || "");
    }
    setIsEditing(true);
  };

  const handleUpdateGroupInfo = async () => {
    if (!editName.trim()) {
      message.error("Group name cannot be empty");
      return;
    }
    setUpdateLoading(true);
    try {
      await axios.patch(
        `${BASE_URL}/conversations/${conversationId}/group`,
        {
          name: editName.trim(),
          description: editBio.trim(),
          avatarUrl: editAvatarUrl.trim(),
        },
        getDevConfig(),
      );
      message.success("Group details updated");
      setIsEditing(false);
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        message.error(err.response?.data?.error || "Failed to update group");
      } else {
        message.error("An unexpected error occurred");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const executeSearch = useCallback(async (value: string) => {
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const config = getDevConfig();
      const res = await axios.get(
        `${BASE_URL}/contacts/search?q=${encodeURIComponent(value)}`,
        { ...config, signal: abortControllerRef.current.signal },
      );
      const rawData = res.data;
      const list: SearchUser[] = Array.isArray(rawData)
        ? rawData
        : rawData?.users || rawData?.contacts || [];
      setSearchResults(list);
    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("User search failed:", err);
      }
    }
  }, []);

  const debouncedSearchUsers = useMemo(
    () => debounce((value: string) => executeSearch(value), 300),
    [executeSearch],
  );

  useEffect(() => {
    return () => {
      debouncedSearchUsers.cancel();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchUsers]);

  const handleAddMember = async () => {
    if (!selectedUserId) {
      message.error("Please select a user to add");
      return;
    }
    setAddLoading(true);
    try {
      await axios.post(
        `${BASE_URL}/conversations/${conversationId}/members`,
        { userId: selectedUserId },
        getDevConfig(),
      );
      message.success("Member added to group");
      setIsAddModalOpen(false);
      setSelectedUserId(null);
      setSearchResults([]);
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        message.error(err.response?.data?.error || "Failed to add member");
      } else {
        message.error("An unexpected error occurred");
      }
    } finally {
      setAddLoading(false);
    }
  };

  const handleKickMember = async (userIdToRemove: string) => {
    try {
      await axios.delete(
        `${BASE_URL}/conversations/${conversationId}/members/kick`,
        {
          ...getDevConfig(),
          data: { userId: userIdToRemove },
        },
      );
      message.success("Member removed");
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        message.error(err.response?.data?.error || "Failed to remove member");
      } else {
        message.error("An unexpected error occurred");
      }
    }
  };

  const handlePromoteAdmin = async (targetUserId: string) => {
    try {
      await axios.patch(
        `${BASE_URL}/conversations/${conversationId}/members/promote`,
        { userId: targetUserId },
        getDevConfig(),
      );
      message.success("User promoted to Admin");
      fetchGroupDetails();
      if (onGroupUpdated) onGroupUpdated();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        message.error(err.response?.data?.error || "Failed to promote member");
      } else {
        message.error("An unexpected error occurred");
      }
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await axios.post(
        `${BASE_URL}/conversations/${conversationId}/leave`,
        {},
        getDevConfig(),
      );
      message.success("You left the group");
      onClose();
      onGroupLeftOrDeleted();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        message.error(err.response?.data?.error || "Failed to leave group");
      } else {
        message.error("An unexpected error occurred");
      }
    }
  };

  const handleDeleteGroup = async () => {
    try {
      await axios.delete(
        `${BASE_URL}/conversations/${conversationId}`,
        getDevConfig(),
      );
      message.success("Group deleted successfully");
      onClose();
      onGroupLeftOrDeleted();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        message.error(err.response?.data?.error || "Failed to delete group");
      } else {
        message.error("An unexpected error occurred");
      }
    }
  };

  const filteredSearchResults = useMemo(() => {
    if (!groupData) return searchResults;
    const existingMemberIds = new Set(groupData.members.map((m) => m.id));
    return searchResults.filter((u) => {
      const uId = u.id || u._id;
      return uId && !existingMemberIds.has(uId);
    });
  }, [searchResults, groupData]);

  const selectOptions = useMemo(() => {
    return filteredSearchResults.map((u) => {
      const uId = u.id || u._id;
      return {
        key: uId,
        value: uId,
        label: `${u.username || u.name} (${u.email})`,
      };
    });
  }, [filteredSearchResults]);

  const currentPreviewAvatar =
    editAvatarUrl || groupData?.avatarUrl || undefined;

  return (
    <>
      <Drawer
        title="Group Info"
        placement="right"
        width={380}
        onClose={onClose}
        open={isOpen}
        destroyOnClose
      >
        {loading ? (
          <LoadingContainer>
            <Spin size="large" />
          </LoadingContainer>
        ) : fetchError || !groupData ? (
          <ErrorContainer>
            <Empty description="Failed to load group details">
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={fetchGroupDetails}
              >
                Retry
              </Button>
            </Empty>
          </ErrorContainer>
        ) : (
          <div>
            <DrawerHeader>
              {isEditing ? (
                <Tooltip title="Click to change photo">
                  <Upload
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      const isImage = file.type.startsWith("image/");
                      if (!isImage) {
                        message.error("Please upload an image file!");
                        return false;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        if (typeof reader.result === "string") {
                          setEditAvatarUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                      return false;
                    }}
                  >
                    <AvatarUploadWrapper>
                      <GroupAvatar
                        size={84}
                        src={currentPreviewAvatar}
                        icon={<TeamOutlined />}
                      >
                        {!currentPreviewAvatar &&
                          groupData.name?.charAt(0).toUpperCase()}
                      </GroupAvatar>
                      <CameraOverlay>
                        <CameraIconWrapper />
                        <span>Change</span>
                      </CameraOverlay>
                    </AvatarUploadWrapper>
                  </Upload>
                </Tooltip>
              ) : (
                <GroupAvatar
                  size={84}
                  src={groupData.avatarUrl || undefined}
                  icon={<TeamOutlined />}
                >
                  {!groupData.avatarUrl &&
                    groupData.name?.charAt(0).toUpperCase()}
                </GroupAvatar>
              )}

              <DrawerTitle>{groupData.name}</DrawerTitle>
              <GroupBio>
                {groupData.description || "No group description available."}
              </GroupBio>

              <MemberCountTag color="blue">
                {groupData.members.length}{" "}
                {groupData.members.length === 1 ? "member" : "members"}
              </MemberCountTag>

              {groupData.amIAdmin && !isEditing && (
                <EditTriggerButton
                  type="default"
                  icon={<EditOutlined />}
                  onClick={handleStartEditing}
                >
                  Edit Group Info
                </EditTriggerButton>
              )}
            </DrawerHeader>

            {isEditing && groupData.amIAdmin && (
              <EditSection>
                <div>
                  <Label>Group Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Group name"
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Input.TextArea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="Group description"
                  />
                </div>

                <ButtonRow>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={updateLoading}
                    onClick={handleUpdateGroupInfo}
                  >
                    Save Changes
                  </Button>
                  <Button
                    icon={<CloseOutlined />}
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </ButtonRow>
              </EditSection>
            )}

            <SectionDivider />

            <MembersHeader>
              <MembersTitle>
                <TeamOutlined /> Group Members
              </MembersTitle>

              {groupData.amIAdmin && (
                <Button
                  type="primary"
                  size="small"
                  icon={<UserAddOutlined />}
                  onClick={() => setIsAddModalOpen(true)}
                >
                  Add Member
                </Button>
              )}
            </MembersHeader>

            <List
              itemLayout="horizontal"
              dataSource={groupData.members}
              renderItem={(member) => (
                <MemberItem
                  actions={[
                    groupData.amIAdmin && !member.isAdmin ? (
                      <Tooltip title="Promote to Admin" key="promote">
                        <Popconfirm
                          title="Promote this member to Group Admin?"
                          onConfirm={() => handlePromoteAdmin(member.id)}
                          okText="Yes"
                          cancelText="No"
                        >
                          <PromoteIconButton
                            type="text"
                            icon={<CrownOutlined />}
                          />
                        </Popconfirm>
                      </Tooltip>
                    ) : null,
                    groupData.amIAdmin && !member.isAdmin ? (
                      <Tooltip title="Remove member" key="kick">
                        <Popconfirm
                          title="Are you sure you want to remove this member?"
                          onConfirm={() => handleKickMember(member.id)}
                          okText="Remove"
                          cancelText="Cancel"
                          okButtonProps={{ danger: true }}
                        >
                          <Button
                            type="text"
                            danger
                            icon={<UserDeleteOutlined />}
                          />
                        </Popconfirm>
                      </Tooltip>
                    ) : null,
                  ].filter(Boolean)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar src={member.avatarUrl} icon={<UserOutlined />} />
                    }
                    title={
                      <MemberNameWrapper>
                        <span>{member.username}</span>
                        {member.isAdmin && (
                          <AdminTag color="gold" icon={<CrownOutlined />}>
                            Admin
                          </AdminTag>
                        )}
                      </MemberNameWrapper>
                    }
                    description={<EmailText>{member.email}</EmailText>}
                  />
                </MemberItem>
              )}
            />

            <SectionDivider />

            <DrawerFooter>
              <Popconfirm
                title="Are you sure you want to leave this group?"
                onConfirm={handleLeaveGroup}
                okText="Leave"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <Button block danger icon={<LogoutOutlined />}>
                  Leave Group
                </Button>
              </Popconfirm>

              {groupData.amIAdmin && (
                <Popconfirm
                  title="Are you sure you want to delete this group? All messages and data will be permanently cleared."
                  onConfirm={handleDeleteGroup}
                  okText="Delete Group"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                >
                  <Button block danger type="primary" icon={<DeleteOutlined />}>
                    Delete Group
                  </Button>
                </Popconfirm>
              )}
            </DrawerFooter>
          </div>
        )}
      </Drawer>

      <Modal
        title="Add Member to Group"
        open={isAddModalOpen}
        onOk={handleAddMember}
        confirmLoading={addLoading}
        onCancel={() => {
          setIsAddModalOpen(false);
          setSelectedUserId(null);
          setSearchResults([]);
        }}
      >
        <ModalBody>
          <Label>Search User by Name or Email</Label>
          <UserSelect
            showSearch
            placeholder="Type a username..."
            onSearch={debouncedSearchUsers}
            onChange={(val) => setSelectedUserId(val as string)}
            filterOption={false}
            options={selectOptions}
          />
        </ModalBody>
      </Modal>
    </>
  );
};
