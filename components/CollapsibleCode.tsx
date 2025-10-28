'use client'

import { useState } from 'react'
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

interface CollapsibleCodeProps {
  title?: string
  defaultOpen?: boolean
  children: React.ReactNode
  language?: string
}

export default function CollapsibleCode({
  title = '代码示例',
  defaultOpen = false,
  children,
  language = 'text',
}: CollapsibleCodeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="my-4 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      {/* 标题栏 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-gray-50 px-4 py-3 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
      >
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</span>
          {language && (
            <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600 dark:bg-gray-600 dark:text-gray-400">
              {language}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronDownIcon className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRightIcon className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* 代码内容 */}
      {isOpen && <div className="border-t border-gray-200 dark:border-gray-700">{children}</div>}
    </div>
  )
}
