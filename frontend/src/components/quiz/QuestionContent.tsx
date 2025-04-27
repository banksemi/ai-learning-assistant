import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/CodeBlock';

interface QuestionContentProps {
  questionText: string;
}

const QuestionContent: React.FC<QuestionContentProps> = ({ questionText }) => {
  return (
    <div className="prose dark:prose-invert mt-1 text-left max-w-none">
      <ReactMarkdown
        children={questionText}
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <CodeBlock
                language={match ? match[1] : undefined}
                value={String(children).replace(/\n$/, '')}
                {...props}
              />
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      />
    </div>
  );
};

export default QuestionContent;
