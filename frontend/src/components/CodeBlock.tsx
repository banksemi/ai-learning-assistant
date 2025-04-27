import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'; // Choose a style

interface CodeBlockProps {
  language: string | undefined; // Language might be undefined
  value: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  // Provide a default language if none is specified
  const lang = language || 'plaintext';

  return (
    <SyntaxHighlighter
      language={lang}
      style={atomDark} // Use the imported style
      showLineNumbers={false} // Optional: show line numbers
      wrapLines={true}
      // Added margin: 0 to customStyle
      customStyle={{
          padding: '0.75rem',
          margin: 0, // Explicitly remove margin
          borderRadius: '0.375rem',
          fontSize: '0.875rem'
      }} // Tailwind p-3, md radius, sm font size
    >
      {String(value).replace(/\n$/, '')}
    </SyntaxHighlighter>
  );
};

export default CodeBlock;
