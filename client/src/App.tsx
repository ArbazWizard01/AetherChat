import { useState } from "react";
import styled from "styled-components";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext.js";
import { AuthView } from "./components/AuthView.js";
import { SidebarView } from "./components/SidebarView.js";
import { ChatPane } from "./components/ChatPane.js";
import { ProfilePage } from "./pages/ProfilePage.js";

const AppContainer = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
`;

const SidebarWrapper = styled.div<{ $hideOnMobile: boolean }>`
  width: 350px;
  height: 100%;

  @media (max-width: 768px) {
    width: 100%;
    display: ${(props) => (props.$hideOnMobile ? "none" : "block")};
  }
`;

const MainContentWrapper = styled.div<{ $hideOnMobile: boolean }>`
  flex: 1;
  height: 100%;
  display: flex;

  @media (max-width: 768px) {
    width: 100%;
    display: ${(props) => (props.$hideOnMobile ? "none" : "flex")};
  }
`;

const EmptyStatePlaceholder = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f7f9fa;
  color: #8c8c8c;
  font-size: 16px;
  padding: 20px;
  text-align: center;
`;

interface ActiveChatDetails {
  name: string;
  isGroup: boolean;
}

function ChatLayout() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = (location.state as ActiveChatDetails) || {};

  const [activeChatMeta, setActiveChatMeta] = useState<ActiveChatDetails>({
    name: locationState.name || "",
    isGroup: locationState.isGroup || false,
  });

  const handleSelectChat = (
    id: string | null,
    name: string,
    isGroup = false,
  ) => {
    if (!id) {
      navigate("/chat");
    } else {
      setActiveChatMeta({ name, isGroup });
      navigate(`/chat/${id}`, { state: { name, isGroup } });
    }
  };

  const chatName = activeChatMeta.name || locationState.name || "";
  const isGroupChat = activeChatMeta.isGroup ?? locationState.isGroup ?? false;

  return (
    <AppContainer>
      <SidebarWrapper $hideOnMobile={!!conversationId}>
        <SidebarView
          selectedChatId={conversationId || ""}
          onSelectChat={handleSelectChat}
          onOpenProfile={() => navigate("/profile")}
        />
      </SidebarWrapper>

      <MainContentWrapper $hideOnMobile={!conversationId}>
        {conversationId ? (
          <ChatPane
            key={conversationId}
            conversationId={conversationId}
            conversationName={chatName}
            isGroup={isGroupChat}
            onBack={() => navigate("/chat")}
          />
        ) : (
          <EmptyStatePlaceholder>
            Select a dialogue or group channel from the menu list to start
            streaming.
          </EmptyStatePlaceholder>
        )}
      </MainContentWrapper>
    </AppContainer>
  );
}

function ProfileRoute() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  return (
    <ProfilePage
      currentUser={{
        id: user?.id || "",
        username: typeof user?.username === "string" ? user.username : "",
        email: (user as any)?.email || "",
        avatarUrl: (user as any)?.avatarUrl || "",
        bio: (user as any)?.bio || "",
        githubUrl: (user as any)?.githubUrl || "",
        linkedinUrl: (user as any)?.linkedinUrl || "",
        websiteUrl: (user as any)?.websiteUrl || "",
      }}
      onBack={() => navigate("/chat")}
      onProfileUpdated={(updatedData) => {
        if (updateUser) updateUser(updatedData);
      }}
    />
  );
}

function App() {
  const { token } = useAuth();

  if (!token) {
    return <AuthView />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/chat" element={<ChatLayout />} />
        <Route path="/chat/:conversationId" element={<ChatLayout />} />
        <Route path="/profile" element={<ProfileRoute />} />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
