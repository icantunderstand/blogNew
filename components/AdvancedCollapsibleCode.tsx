'use client'

import { useState, useRef } from 'react'
import type { ReactNode } from 'react'
import { ChevronDownIcon, ChevronRightIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'

interface AdvancedCollapsibleCodeProps {
  title?: string
  defaultOpen?: boolean
  children: React.ReactNode
  language?: string
  showLineNumbers?: boolean
  maxHeight?: string
}

export default function AdvancedCollapsibleCode({ 
  title = "代码示例", 
  defaultOpen = false, 
  children, 
  language = "text",
  showLineNumbers = false,
  maxHeight = "400px"
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
    <div className="my-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 px-2 py-1 rounded transition-colors"
        >
          {isOpen ? (
            <ChevronDownIcon className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRightIcon className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {title}
          </span>
          {language && (
            <span className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded">
              {language}
            </span>
          )}
        </button>
        
        {isOpen && (
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <ClipboardDocumentIcon className="w-3 h-3" />
            <span>{copied ? '已复制!' : '复制'}</span>
          </button>
        )}
      </div>

      {/* 代码内容 */}
      {isOpen && (
        <div 
          className="relative overflow-auto"
          style={{ maxHeight }}
        >
          <div ref={codeRef} className="relative">
            {children}
          </div>
          
          {/* 渐变遮罩（当内容超出最大高度时） */}
          {maxHeight !== 'none' && (
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
          )}
        </div>
      )}
    </div>
  )
}
