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
          color: #1A1A1A;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4 {
          color: #1A1A1A;
          font-weight: 700;
          margin-top: 3rem;
          margin-bottom: 1.25rem;
        }
        .prose h1 {
          font-size: 2.5rem;
          line-height: 1.2;
        }
        .prose h2 {
          font-size: 2rem;
          line-height: 1.3;
          border-bottom: 2px solid #E5E5E5;
          padding-bottom: 0.75rem;
          margin-top: 3.5rem;
        }
        .prose h3 {
          font-size: 1.5rem;
          margin-top: 2.5rem;
        }
        .prose p {
          margin-bottom: 1.75rem;
          line-height: 1.8;
          color: #525252;
          font-size: 1.125rem;
        }
        .prose a {
          color: #84CC16;
          text-decoration: none;
          font-weight: 600;
          transition: all 0.2s ease;
          border-bottom: 2px solid #B4D88B;
        }
        .prose a:hover {
          color: #65A30D;
          border-bottom-color: #84CC16;
        }
        .prose strong {
          color: #1A1A1A;
          font-weight: 700;
        }
        .prose code {
          background: #F5F5F5;
          color: #1A1A1A;
          padding: 0.25rem 0.5rem;
          border-radius: 0.375rem;
          font-size: 0.9em;
          font-family: 'Monaco', 'Courier New', monospace;
          border: 1px solid #E5E5E5;
        }
        .prose pre {
          background: #1A1A1A;
          color: #B4D88B;
          padding: 1.5rem;
          border-radius: 0.75rem;
          overflow-x: auto;
          margin: 2rem 0;
          border: 1px solid #333;
        }
        .prose pre code {
          background: transparent;
          padding: 0;
          border: none;
          color: #B4D88B;
        }
        .prose ul,
        .prose ol {
          margin-left: 2rem;
          margin-bottom: 2rem;
          margin-top: 1rem;
        }
        .prose li {
          margin-bottom: 0.75rem;
          color: #525252;
          line-height: 1.7;
          font-size: 1.125rem;
        }
        .prose li::marker {
          color: #B4D88B;
          font-weight: bold;
        }
        .prose blockquote {
          border-left: 4px solid #B4D88B;
          padding-left: 1.5rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          margin: 2.5rem 0;
          font-style: italic;
          color: #525252;
          background: #F9FAFB;
          border-radius: 0 0.5rem 0.5rem 0;
          font-size: 1.125rem;
        }
        .prose img {
          border-radius: 0.75rem;
          margin: 2.5rem 0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        }
      `}</style>
      {children}
    </div>
  );
}
