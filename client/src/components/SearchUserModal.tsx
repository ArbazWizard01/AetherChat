import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  X,
  UserPlus,
  Check,
  Loader2,
  User as UserIcon,
} from "lucide-react";

import {
  ModalOverlay,
  ModalContainer,
  ModalHeader,
  ModalTitle,
  CloseButton,
  SearchSection,
  SearchInputWrapper,
  SearchInput,
  ClearSearchButton,
  ResultsSection,
  UserList,
  UserCard,
  UserInfo,
  AvatarWrapper,
  AvatarImage,
  AvatarFallback,
  UserDetails,
  Username,
  UserEmail,
  ActionButton,
  EmptyState,
  StatusBadge,
} from "./SearchUserModal.styles.js";

export interface SearchedUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  relationshipStatus?: "none" | "pending_sent" | "pending_received" | "friends";
}

interface SearchUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const SearchUserModal: React.FC<SearchUserModalProps> = ({
  isOpen,
  onClose,
  currentUserId,
}) => {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingIds, setSendingIds] = useState<Record<string, boolean>>({});
  const [sentIds, setSentIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setUsers([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          `http://localhost:8080/api/contacts/search?query=${encodeURIComponent(
            searchQuery.trim(),
          )}`,
          { withCredentials: true },
        );

        const searchResults: SearchedUser[] =
          response.data?.users || response.data || [];

        const filtered = searchResults.filter((u) => u.id !== currentUserId);
        setUsers(filtered);
      } catch (err: any) {
        setError(err.response?.data?.error || "Failed to search users.");
      } finally {
        setLoading(false);
      }
    },
    [currentUserId],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        handleSearch(query);
      } else {
        setUsers([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, handleSearch]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setUsers([]);
      setError(null);
    }
  }, [isOpen]);

  const handleSendInvite = async (targetUserId: string) => {
    setSendingIds((prev) => ({ ...prev, [targetUserId]: true }));

    try {
      await axios.post(
        "http://localhost:8080/api/contacts/requests/send",
        { receiverId: targetUserId },
        { withCredentials: true },
      );

      setSentIds((prev) => ({ ...prev, [targetUserId]: true }));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to send contact request.");
    } finally {
      setSendingIds((prev) => ({ ...prev, [targetUserId]: false }));
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContainer onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Add New Contact</ModalTitle>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <SearchSection>
          <SearchInputWrapper>
            <Search size={18} />
            <SearchInput
              type="text"
              placeholder="Search by username or email address..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <ClearSearchButton onClick={() => setQuery("")}>
                <X size={16} />
              </ClearSearchButton>
            )}
          </SearchInputWrapper>
        </SearchSection>

        <ResultsSection>
          {loading ? (
            <EmptyState>
              <Loader2 size={24} className="spinner" />
              <span>Searching directory...</span>
            </EmptyState>
          ) : error ? (
            <EmptyState style={{ color: "#ff4d4f" }}>{error}</EmptyState>
          ) : users.length > 0 ? (
            <UserList>
              {users.map((user) => {
                const isRequestSent =
                  sentIds[user.id] ||
                  user.relationshipStatus === "pending_sent";
                const isAlreadyFriend = user.relationshipStatus === "friends";
                const isPendingReceived =
                  user.relationshipStatus === "pending_received";
                const isSending = sendingIds[user.id];

                return (
                  <UserCard key={user.id}>
                    <UserInfo>
                      <AvatarWrapper>
                        {user.avatarUrl ? (
                          <AvatarImage
                            src={user.avatarUrl}
                            alt={user.username}
                          />
                        ) : (
                          <AvatarFallback>
                            {user.username
                              ? user.username.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        )}
                      </AvatarWrapper>

                      <UserDetails>
                        <Username>{user.username}</Username>
                        <UserEmail>{user.email}</UserEmail>
                      </UserDetails>
                    </UserInfo>

                    {isAlreadyFriend ? (
                      <StatusBadge $type="friend">Connected</StatusBadge>
                    ) : isPendingReceived ? (
                      <StatusBadge $type="pending">
                        Request Received
                      </StatusBadge>
                    ) : isRequestSent ? (
                      <StatusBadge $type="sent">
                        <Check size={14} /> Invite Sent
                      </StatusBadge>
                    ) : (
                      <ActionButton
                        onClick={() => handleSendInvite(user.id)}
                        disabled={isSending}
                      >
                        {isSending ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <>
                            <UserPlus size={16} />
                            <span>Add</span>
                          </>
                        )}
                      </ActionButton>
                    )}
                  </UserCard>
                );
              })}
            </UserList>
          ) : query.trim() ? (
            <EmptyState>
              <UserIcon size={32} />
              <span>No users found matching "{query}"</span>
            </EmptyState>
          ) : (
            <EmptyState>
              <Search size={32} />
              <span>Type a username or email to search</span>
            </EmptyState>
          )}
        </ResultsSection>
      </ModalContainer>
    </ModalOverlay>
  );
};
