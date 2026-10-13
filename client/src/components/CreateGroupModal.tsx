import React, { useState, useEffect, useCallback } from "react";
import { Modal, Input, message } from "antd";
import { UsergroupAddOutlined } from "@ant-design/icons";
import axios from "axios";
import {
  TitleIconWrapper,
  ModalBody,
  FieldGroup,
  Label,
  MemberSelect,
} from "./CreateGroupModal.styles";

interface UserOption {
  id: string;
  username: string;
  email: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated: (newGroup: any) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const [groupName, setGroupName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<UserOption[]>([]);
  const [userCache, setUserCache] = useState<Map<string, UserOption>>(
    new Map(),
  );
  const [loading, setLoading] = useState<boolean>(false);

  const fetchUsers = useCallback(async (query: string = "") => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/contacts/search?q=${encodeURIComponent(query)}`,
        { withCredentials: true },
      );

      const rawData = res.data;
      const userList: any[] = Array.isArray(rawData)
        ? rawData
        : rawData?.users || rawData?.contacts || rawData?.data || [];

      const normalizedUsers: UserOption[] = userList
        .map((u: any) => {
          const target = u?.user || u?.peer || u;
          const id = String(target?.id || target?._id || u?.userId || "");
          const username =
            target?.username ||
            target?.name ||
            u?.username ||
            u?.name ||
            "Unknown User";
          const email = target?.email || u?.email || "";

          return { id, username, email };
        })
        .filter((u: UserOption) => Boolean(u.id));

      setSearchResults(normalizedUsers);

      setUserCache((prevCache) => {
        const updated = new Map(prevCache);
        normalizedUsers.forEach((u) => updated.set(u.id, u));
        return updated;
      });
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setSearchResults([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers("");
    } else {
      setGroupName("");
      setDescription("");
      setSelectedUserIds([]);
      setSearchResults([]);
    }
  }, [isOpen, fetchUsers]);

  const handleSearchUsers = (value: string) => {
    fetchUsers(value.trim());
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      message.error("Please provide a group name");
      return;
    }

    if (selectedUserIds.length === 0) {
      message.error("You must select at least one member to create a group");
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(
        "http://localhost:8080/api/conversations",
        {
          name: groupName.trim(),
          description: description.trim(),
          isGroup: true,
          memberIds: selectedUserIds,
        },
        { withCredentials: true },
      );

      message.success("Group created successfully!");
      onGroupCreated(res.data);
      onClose();
    } catch (err: any) {
      console.error("Create group error details:", err.response?.data || err);
      const serverMessage =
        err.response?.data?.error || err.message || "Failed to create group";
      message.error(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  const combinedMap = new Map(userCache);
  searchResults.forEach((u) => combinedMap.set(u.id, u));

  const safeOptions = Array.from(combinedMap.values()).map((u) => ({
    label: u.email ? `${u.username} (${u.email})` : u.username,
    value: u.id,
  }));

  return (
    <Modal
      title={
        <span>
          <TitleIconWrapper>
            <UsergroupAddOutlined />
          </TitleIconWrapper>
          Create New Group Chat
        </span>
      }
      open={isOpen}
      onOk={handleCreate}
      confirmLoading={loading}
      onCancel={onClose}
      okText="Create Group"
    >
      <ModalBody>
        <FieldGroup>
          <Label>Group Name *</Label>
          <Input
            placeholder="e.g. Core Engineering, Chill Room"
            value={groupName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setGroupName(e.target.value)
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label>Group Description / Bio</Label>
          <Input.TextArea
            placeholder="What is this group about?"
            rows={2}
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
          />
        </FieldGroup>

        <FieldGroup>
          <Label>Add Members *</Label>
          <MemberSelect
            mode="multiple"
            showSearch
            value={selectedUserIds}
            placeholder="Type username or email to search..."
            onSearch={handleSearchUsers}
            onChange={(values: unknown) =>
              setSelectedUserIds(values as string[])
            }
            filterOption={false}
            options={safeOptions}
          />
        </FieldGroup>
      </ModalBody>
    </Modal>
  );
};
