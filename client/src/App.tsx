import { useState } from "react";
import styled from "styled-components";
import { useAuth } from "./context/AuthContext.js";
import { AuthView } from "./components/AuthView.js";
import { SidebarView } from "./components/SidebarView.js";
import { ChatPane } from "./components/ChatPane.js";

const AppContainer = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #ffffff;
`;

const EmptyStatePlaceholder = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f7f9fa;
  color: #8c8c8c;
  font-size: 16px;
`;

interface ActiveChatState {
  id: string;
  name: string;
}

function App() {
  const { token } = useAuth();
  const [activeChat, setActiveChat] = useState<ActiveChatState | null>(null);

  if (!token) {
    return <AuthView />;
  }

  return (
    <AppContainer>
      <SidebarView
        selectedChatId={activeChat?.id || null}
        onSelectChat={(id, name) => setActiveChat({ id, name })}
      />

      {activeChat ? (
        <ChatPane
          conversationId={activeChat.id}
          conversationName={activeChat.name}
        />
      ) : (
        <EmptyStatePlaceholder>
          Select a dialogue or group channel from the menu list to start
          streaming.
        </EmptyStatePlaceholder>
      )}
    </AppContainer>
  );
}

export default App;
