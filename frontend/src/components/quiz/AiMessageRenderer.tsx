import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Language } from '@/types'; // Import Language type

// Define the message type expected by this component
interface Message {
  id?: number;
  sender: 'user' | 'ai';
  text: string;
}

interface AiMessageRendererProps {
  message: Message;
  isStreaming: boolean; // Flag to indicate if this message is currently being streamed
  language: Language; // Pass language for loading text
  speed: number; // Add speed prop
}

const AiMessageRenderer: React.FC<AiMessageRendererProps> = ({ message, isStreaming, language, speed }) => {
  // Apply typing effect only if it's an AI message and currently streaming
  // Pass the dynamic speed to the hook
  const displayText = isStreaming && message.sender === 'ai'
    ? useTypingEffect(message.text, speed) // Use the speed prop
    : message.text;

  // Show loading indicator only if streaming and the text hasn't started typing yet
  const showLoading = isStreaming && message.sender === 'ai' && displayText === '';

  return (
    <>
      {showLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="italic text-muted-foreground">
            {language === 'ko' ? '답변 생성 중...' : 'Generating response...'}
          </span>
        </div>
      ) : (
        <ReactMarkdown
          children={displayText} // Render the (potentially partially typed) text
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              if (!inline && match) {
                return (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                  />
                );
              }
              // Apply standard code styling even during typing
              return (
                <code
                  className={cn(
                    "font-normal bg-muted text-foreground px-1 py-0.5 rounded-sm text-sm border border-border", // Ensure inline code style matches index.css
                    className
                  )}
                  {...props} // Pass props down
                >
                  {children}
                </code>
              );
            },
            pre: ({ node, ...props }) => <pre style={{ margin: 0 }} {...props} />,
            // Ensure paragraphs render correctly during typing
            p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
          }}
        />
      )}
    </>
  );
};

export default AiMessageRenderer;
