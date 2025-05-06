import React from 'react';
    import ReactMarkdown from 'react-markdown';
    import remarkGfm from 'remark-gfm';
    import CodeBlock from '@/components/CodeBlock';
    import { cn } from '@/lib/utils';

    interface MarkdownRendererProps {
      content: string;
      className?: string;
    }

    const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
      return (
        // Add overflow-x-auto directly to the prose container
        <div className={cn("prose dark:prose-invert max-w-none overflow-x-auto", className)}>
          <ReactMarkdown
            children={content}
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
                // react-markdown passes the output of the 'code' component as children to 'pre'.
                if (React.Children.count(children) === 1) {
                  const childElement = React.Children.toArray(children)[0];
                  if (React.isValidElement(childElement) && childElement.type === CodeBlock) {
                    // If it's CodeBlock, it already renders a <pre>. So just return it.
                    return <>{childElement}</>;
                  }
                }
                // Default behavior for other <pre> tags (e.g., if not using CodeBlock)
                // This ensures .prose pre styles apply to non-CodeBlock <pre> tags.
                // Apply overflow-x-auto here as well for non-CodeBlock pre tags if needed,
                // though the parent div's overflow should handle it.
                return <pre {...props}>{children}</pre>;
              },
              p: ({ node, ...props }) => <p style={{ margin: 0 }} {...props} />,
            }}
          />
        </div>
      );
    };

    export default MarkdownRenderer;
