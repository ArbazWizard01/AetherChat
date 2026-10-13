import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Check, X, Clock, Loader2, Inbox, Send } from "lucide-react";

import {
  Container,
  Header,
  Title,
  TabGroup,
  TabButton,
  Badge,
  ContentArea,
  RequestList,
  RequestCard,
  UserInfo,
  AvatarWrapper,
  AvatarImage,
  AvatarFallback,
  UserDetails,
  Username,
  Timestamp,
  ButtonGroup,
  IconButton,
  EmptyState,
} from "./PendingRequests.styles";

export interface PendingContactRequest {
  id: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    avatarUrl?: string;
  };
}

interface PendingRequestsProps {
  onContactAccepted?: () => void;
}

export const PendingRequests: React.FC<PendingRequestsProps> = ({
  onContactAccepted,
}) => {
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing">(
    "incoming",
  );
  const [incoming, setIncoming] = useState<PendingContactRequest[]>([]);
  const [outgoing, setOutgoing] = useState<PendingContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingIds, setActionLoadingIds] = useState<
    Record<string, boolean>
  >({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "http://localhost:8080/api/contacts/pending",
        { withCredentials: true },
      );

      setIncoming(response.data?.incoming || []);
      setOutgoing(response.data?.outgoing || []);
    } catch (err) {
      console.error("Failed to load pending requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId: string) => {
    setActionLoadingIds((prev) => ({ ...prev, [requestId]: true }));
    try {
      await axios.post(
        "http://localhost:8080/api/contacts/requests/respond",
        { requestId, action: "ACCEPT" },
        { withCredentials: true },
      );

      setIncoming((prev) => prev.filter((item) => item.id !== requestId));

      if (onContactAccepted) {
        onContactAccepted();
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to accept contact request.");
    } finally {
      setActionLoadingIds((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const handleRejectOrCancel = async (
    requestId: string,
    type: "incoming" | "outgoing",
  ) => {
    setActionLoadingIds((prev) => ({ ...prev, [requestId]: true }));
    try {
      await axios.post(
        "http://localhost:8080/api/contacts/requests/respond",
        { requestId, action: "DECLINE" },
        { withCredentials: true },
      );

      if (type === "incoming") {
        setIncoming((prev) => prev.filter((item) => item.id !== requestId));
      } else {
        setOutgoing((prev) => prev.filter((item) => item.id !== requestId));
      }
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to process request.");
    } finally {
      setActionLoadingIds((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  return (
    <Container>
      <Header>
        <Title>Manage Invitations</Title>
        <TabGroup>
          <TabButton
            $active={activeTab === "incoming"}
            onClick={() => setActiveTab("incoming")}
          >
            Received
            {incoming.length > 0 && <Badge>{incoming.length}</Badge>}
          </TabButton>
          <TabButton
            $active={activeTab === "outgoing"}
            onClick={() => setActiveTab("outgoing")}
          >
            Sent
            {outgoing.length > 0 && (
              <Badge $variant="secondary">{outgoing.length}</Badge>
            )}
          </TabButton>
        </TabGroup>
      </Header>

      <ContentArea>
        {loading ? (
          <EmptyState>
            <Loader2 size={24} className="spinner" />
            <span>Loading requests...</span>
          </EmptyState>
        ) : activeTab === "incoming" ? (
          incoming.length > 0 ? (
            <RequestList>
              {incoming.map((req) => {
                const isProcessing = actionLoadingIds[req.id];
                return (
                  <RequestCard key={req.id}>
                    <UserInfo>
                      <AvatarWrapper>
                        {req.user?.avatarUrl ? (
                          <AvatarImage
                            src={req.user.avatarUrl}
                            alt={req.user.username}
                          />
                        ) : (
                          <AvatarFallback>
                            {req.user?.username
                              ? req.user.username.charAt(0).toUpperCase()
                              : "U"}
                          </AvatarFallback>
                        )}
                      </AvatarWrapper>
                      <UserDetails>
                        <Username>{req.user?.username}</Username>
                        <Timestamp>
                          <Clock size={12} />
                          {new Date(req.createdAt).toLocaleDateString()}
                        </Timestamp>
                      </UserDetails>
                    </UserInfo>

                    <ButtonGroup>
                      <IconButton
                        $variant="accept"
                        title="Accept Request"
                        onClick={() => handleAccept(req.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 size={16} className="spinner" />
                        ) : (
                          <Check size={16} />
                        )}
                      </IconButton>
                      <IconButton
                        $variant="decline"
                        title="Decline Request"
                        onClick={() => handleRejectOrCancel(req.id, "incoming")}
                        disabled={isProcessing}
                      >
                        <X size={16} />
                      </IconButton>
                    </ButtonGroup>
                  </RequestCard>
                );
              })}
            </RequestList>
          ) : (
            <EmptyState>
              <Inbox size={32} />
              <span>No incoming invitations</span>
            </EmptyState>
          )
        ) : outgoing.length > 0 ? (
          <RequestList>
            {outgoing.map((req) => {
              const isProcessing = actionLoadingIds[req.id];
              return (
                <RequestCard key={req.id}>
                  <UserInfo>
                    <AvatarWrapper>
                      {req.user?.avatarUrl ? (
                        <AvatarImage
                          src={req.user.avatarUrl}
                          alt={req.user.username}
                        />
                      ) : (
                        <AvatarFallback>
                          {req.user?.username
                            ? req.user.username.charAt(0).toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      )}
                    </AvatarWrapper>
                    <UserDetails>
                      <Username>{req.user?.username}</Username>
                      <Timestamp>
                        <Clock size={12} /> Sent{" "}
                        {new Date(req.createdAt).toLocaleDateString()}
                      </Timestamp>
                    </UserDetails>
                  </UserInfo>

                  <ButtonGroup>
                    <IconButton
                      $variant="decline"
                      title="Cancel Request"
                      onClick={() => handleRejectOrCancel(req.id, "outgoing")}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 size={16} className="spinner" />
                      ) : (
                        <X size={16} />
                      )}
                    </IconButton>
                  </ButtonGroup>
                </RequestCard>
              );
            })}
          </RequestList>
        ) : (
          <EmptyState>
            <Send size={32} />
            <span>No pending outgoing invitations</span>
          </EmptyState>
        )}
      </ContentArea>
    </Container>
  );
};
