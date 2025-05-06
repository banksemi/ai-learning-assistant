import React, { useEffect, useState } from 'react';
    import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
    // Import desired themes
    import { oneLight, vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
    import { useTheme } from 'next-themes'; // Import useTheme hook

    interface CodeBlockProps {
      language: string | undefined; // Language might be undefined
      value: string;
    }

    const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
      const { theme, resolvedTheme } = useTheme(); // Get current theme
      const [currentStyle, setCurrentStyle] = useState(vscDarkPlus); // Default to dark theme initially

      useEffect(() => {
        // Determine the actual theme being used (system preference might resolve to light/dark)
        const activeTheme = resolvedTheme || theme;
        if (activeTheme === 'light') {
          setCurrentStyle(oneLight);
        } else {
          setCurrentStyle(vscDarkPlus);
        }
      }, [theme, resolvedTheme]);

      // Provide a default language if none is specified
      const lang = language || 'plaintext';

      return (
        <SyntaxHighlighter
          language={lang}
          style={currentStyle} // Use the dynamically set style
          showLineNumbers={false}
          wrapLines={false} // Disable line wrapping
          wrapLongLines={false} // Disable long line wrapping
          customStyle={{
              padding: '0.75rem',
              margin: 0, // Explicitly remove margin
              borderRadius: '0.375rem', // md radius
              fontSize: '0.875rem', // sm font size
              whiteSpace: 'pre', // Allows content to determine width and prevents wrapping
              overflowX: 'auto', // Adds horizontal scroll if content overflows
          }}
        >
          {String(value).replace(/\n$/, '')}
        </SyntaxHighlighter>
      );
    };

    export default CodeBlock;
