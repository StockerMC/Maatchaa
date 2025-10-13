"use client";
import { ReactNode } from "react";

interface BlogContentProps {
  children: ReactNode;
  className?: string;
}

export function BlogContent({ children, className }: BlogContentProps) {
  return (
    <div className={`prose prose-lg max-w-none ${className}`}>
      <style jsx global>{`
        .prose {
          color: var(--foreground);
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          color: var(--foreground);
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .prose h1 {
          font-size: 2.5rem;
          line-height: 1.2;
        }
        .prose h2 {
          font-size: 2rem;
          line-height: 1.3;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }
        .prose h3 {
          font-size: 1.5rem;
        }
        .prose p {
          margin-bottom: 1.5rem;
          line-height: 1.75;
          color: var(--muted-foreground);
        }
        .prose a {
          color: var(--primary);
          text-decoration: underline;
          text-decoration-color: var(--matcha-200);
          text-underline-offset: 2px;
          transition: all 0.15s ease-out;
        }
        .prose a:hover {
          text-decoration-color: var(--primary);
        }
        .prose strong {
          color: var(--foreground);
          font-weight: 600;
        }
        .prose code {
          background: var(--muted);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          font-family: ui-monospace, monospace;
        }
        .prose pre {
          background: var(--muted);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        .prose pre code {
          background: transparent;
          padding: 0;
        }
        .prose ul,
        .prose ol {
          margin-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .prose li {
          margin-bottom: 0.5rem;
          color: var(--muted-foreground);
        }
        .prose blockquote {
          border-left: 4px solid var(--primary);
          padding-left: 1rem;
          margin: 1.5rem 0;
          font-style: italic;
          color: var(--muted-foreground);
        }
        .prose img {
          border-radius: 0.5rem;
          margin: 2rem 0;
        }
      `}</style>
      {children}
    </div>
  );
}
