import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTypingEffect } from '@/hooks/useTypingEffect';
import CodeBlock from '@/components/CodeBlock';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Language } from '@/types'; // Import Language type
import { useTranslation } from '@/translations';

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
  const { t } = useTranslation();

  const displayText = isStreaming && message.sender === 'ai'
    ? useTypingEffect(message.text, speed)
    : message.text;

  const showLoading = isStreaming && message.sender === 'ai' && displayText === '';

  return (
    <>
      {showLoading ? (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="italic text-muted-foreground">
            {t('aiChat.generatingResponse')}
          </span>
        </div>
      ) : (
        <ReactMarkdown
          children={displayText}
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className: langClassName, children, ...props }) {
              const match = /language-(\w+)/.exec(langClassName || '');
              if (!inline && match) {
                return (
                  <CodeBlock
                    language={match[1]}
                    value={String(children).replace(/\n$/, '')}
                  />
                );
              }
              return (
                <code
                  className={cn(
                    "font-normal bg-muted text-foreground px-1 py-0.5 rounded-sm text-sm border border-border",
                    langClassName
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children, node, ...props }) => {
              // Check if the direct child is our CodeBlock component.
              if (React.Children.count(children) === 1) {
                const childElement = React.Children.toArray(children)[0];
                if (React.isValidElement(childElement) && childElement.type === CodeBlock) {
                  // If it's CodeBlock, it already renders a <pre>. So just return it.
                  return <>{childElement}</>;
                }
              }
              // Default behavior for other <pre> tags
              return <pre {...props}>{children}</pre>;
            },
            p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
          }}
        />
      )}
    </>
  );
};

export default AiMessageRenderer;
