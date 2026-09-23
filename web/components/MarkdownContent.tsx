"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ text }: { text: string }) {
  return (
    <div className="markdown-body break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="my-1.5 first:mt-0 last:mb-0">{children}</p>,
          ul: ({ children }) => (
            <ul className="my-1.5 list-disc space-y-0.5 pl-5 first:mt-0 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-1.5 list-decimal space-y-0.5 pl-5 first:mt-0 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-[1.5]">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-[var(--muted-light)] underline-offset-2 transition-colors hover:decoration-current focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {children}
            </a>
          ),
          code: ({ children }) => (
            <code className="rounded-md bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[0.85em]">
              {children}
            </code>
          ),
          pre: ({ children }) => (
            <pre className="my-2 overflow-x-auto rounded-lg bg-[var(--accent-soft)] p-3 font-mono text-[13px]">
              {children}
            </pre>
          ),
          h1: ({ children }) => <h3 className="my-2 text-[16px] font-semibold">{children}</h3>,
          h2: ({ children }) => <h3 className="my-2 text-[16px] font-semibold">{children}</h3>,
          h3: ({ children }) => <h3 className="my-2 text-[15px] font-semibold">{children}</h3>,
          h4: ({ children }) => <h4 className="my-1.5 text-[15px] font-semibold">{children}</h4>,
          blockquote: ({ children }) => (
            <blockquote className="my-1.5 border-l-2 border-[var(--border-strong)] pl-3 italic opacity-90">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-2 border-[var(--border)]" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}
