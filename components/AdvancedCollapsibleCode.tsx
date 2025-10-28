'use client'

import { useState, useRef } from 'react'
import type { ReactNode } from 'react'

// 内联图标，避免外部依赖
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
  </svg>
)

const ClipboardDocumentIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 3 3 0 0 0-.75-3.75H15a.75.75 0 0 0-.75.75v1.5m-6 0V6.75A2.25 2.25 0 0 1 9.75 4.5h1.5a2.25 2.25 0 0 1 2.25 2.25v1.5m-6 0h6"
    />
  </svg>
)

interface AdvancedCollapsibleCodeProps {
  title?: string
  defaultOpen?: boolean
  children: React.ReactNode
  language?: string
  showLineNumbers?: boolean
  maxHeight?: string
}

export default function AdvancedCollapsibleCode({
  title = '代码示例',
  defaultOpen = false,
  children,
  language = 'text',
  showLineNumbers = false,
  maxHeight = '400px',
}: AdvancedCollapsibleCodeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const codeRef = useRef<HTMLDivElement>(null)

  const copyToClipboard = async () => {
    if (codeRef.current) {
      const text = codeRef.current.textContent || ''
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Failed to copy text: ', err)
      }
    }
  }

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 rounded px-2 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {isOpen ? (
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          {language && (
            <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-400">
              {language}
            </span>
          )}
        </button>

        {isOpen && (
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 rounded px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <ClipboardDocumentIcon className="h-3 w-3" />
            <span>{copied ? '已复制!' : '复制'}</span>
          </button>
        )}
      </div>

      {/* 代码内容 */}
      {isOpen && (
        <div className="relative overflow-auto" style={{ maxHeight }}>
          <div ref={codeRef} className="relative">
            {children}
          </div>
          {/* 渐变遮罩（当内容超出最大高度时） */}
          {maxHeight !== 'none' && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent dark:from-gray-900" />
          )}
        </div>
      )}
    </div>
  )
}
