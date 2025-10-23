'use client'

import { useState } from 'react'

interface SimpleCollapsibleCodeProps {
  title?: string
  defaultOpen?: boolean
  children: React.ReactNode
  language?: string
}

export default function SimpleCollapsibleCode({ 
  title = "代码示例", 
  defaultOpen = false, 
  children, 
  language = "text" 
}: SimpleCollapsibleCodeProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="collapsible-code">
      {/* 标题栏 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="collapsible-code-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="collapsible-code-title">
            {title}
          </span>
          {language && (
            <span className="collapsible-code-language">
              {language}
            </span>
          )}
        </div>
        <span className="collapsible-code-toggle" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
          ▶
        </span>
      </button>

      {/* 代码内容 */}
      {isOpen && (
        <div className="collapsible-code-content">
          {children}
        </div>
      )}
    </div>
  )
}
