import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled from "styled-components";

const StyledMarkdownWrapper = styled.div`
  font-size: 14px;
  line-height: 1.6;
  color: #262626;

  p {
    margin: 0 0 8px 0;
    &:last-child {
      margin-bottom: 0;
    }
  }

  strong {
    font-weight: 600;
    color: #1f1f1f;
  }

  ul,
  ol {
    margin: 6px 0 10px 0;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  code {
    background: #f0f2f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 13px;
    color: #0958d9;
  }

  pre {
    background: #f5f5f5;
    padding: 10px 12px;
    border-radius: 6px;
    overflow-x: auto;
    font-size: 13px;

    code {
      background: transparent;
      padding: 0;
    }
  }

  blockquote {
    margin: 8px 0;
    padding-left: 12px;
    border-left: 3px solid #1677ff;
    color: #595959;
  }
`;

interface MarkdownContentProps {
  content: string;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
}) => {
  return (
    <StyledMarkdownWrapper>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </StyledMarkdownWrapper>
  );
};
