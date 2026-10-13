import React, { useState, useRef } from "react";
import styled from "styled-components";

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const MentionDropdown = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 250px;
  max-height: 200px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 8px;
  z-index: 1000;
`;

const MentionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;

  &:hover {
    background: #f5f5f5;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  outline: none;
  font-size: 14px;

  &:focus {
    border-color: #1677ff;
  }
`;

interface Member {
  id: string;
  name: string;
  isBot?: boolean;
}

interface ChatInputProps {
  onSendMessage: (text: string) => void;
  members?: Member[]; 
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  members = [],
}) => {
  const [text, setText] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableMentions: Member[] = [
    { id: "aetherbot", name: "AetherBot", isBot: true },
    ...members,
  ];

  const filteredMentions =
    mentionQuery !== null
      ? availableMentions.filter((m) =>
          m.name.toLowerCase().includes(mentionQuery.toLowerCase())
        )
      : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setText(value);

    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const query = textBeforeCursor.slice(lastAtIndex + 1);
      if (!query.includes(" ")) {
        setMentionQuery(query);
        setMentionIndex(lastAtIndex);
        return;
      }
    }
    setMentionQuery(null);
  };

  const handleSelectMention = (member: Member) => {
    if (mentionIndex === -1) return;

    const before = text.slice(0, mentionIndex);
    const after = text.slice(inputRef.current?.selectionStart || text.length);
    const updatedText = `${before}@${member.name} ${after}`;

    setText(updatedText);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && mentionQuery === null) {
      e.preventDefault();
      if (text.trim()) {
        onSendMessage(text);
        setText("");
      }
    }
  };

  return (
    <InputWrapper>
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <MentionDropdown>
          {filteredMentions.map((member) => (
            <MentionItem
              key={member.id}
              onClick={() => handleSelectMention(member)}
            >
              <span>{member.isBot ? "🤖" : "👤"}</span>
              <strong>{member.name}</strong>
            </MentionItem>
          ))}
        </MentionDropdown>
      )}

      <StyledInput
        ref={inputRef}
        type="text"
        placeholder="Type a message or @ to mention..."
        value={text}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
      />
    </InputWrapper>
  );
};