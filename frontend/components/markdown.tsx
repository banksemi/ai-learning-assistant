"use client"
import ReactMarkdown from "react-markdown"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism"
import remarkGfm from "remark-gfm"

interface MarkdownProps {
  content: string
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className="prose dark:prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "")
          return !inline && match ? (
            <SyntaxHighlighter
              language={match[1]}
              style={vscDarkPlus}
              PreTag="div"
              className="rounded-md border dark:border-gray-700 !bg-gray-900 dark:!bg-gray-950"
              {...props}
            >
              {String(children).replace(/\n$/, "")}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          )
        },
        table({ node, ...props }) {
          return (
            <div className="overflow-x-auto">
              <table className="border-collapse border border-gray-300 dark:border-gray-700" {...props} />
            </div>
          )
        },
        th({ node, ...props }) {
          return (
            <th
              className="border border-gray-300 dark:border-gray-700 px-4 py-2 bg-gray-100 dark:bg-gray-800"
              {...props}
            />
          )
        },
        td({ node, ...props }) {
          return <td className="border border-gray-300 dark:border-gray-700 px-4 py-2" {...props} />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
