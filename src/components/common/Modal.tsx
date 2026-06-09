import { useEffect, useRef, useCallback, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'w-[400px] max-w-[90vw]',
  md: 'w-[500px] max-w-[90vw]',
  lg: 'w-[650px] max-w-[90vw]',
  xl: 'w-[800px] max-w-[95vw]',
}

export default function Modal({ open, onClose, children, className = '', title, size = 'md' }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key === 'Tab') {
        const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
        if (!focusable || focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return

    const previousActiveElement = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'

    setTimeout(() => {
      const focusable = contentRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable && focusable.length > 0) {
        focusable[0].focus()
      }
    }, 50)

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <div
        ref={contentRef}
        className={`bg-editor-surface border border-editor-border rounded-lg shadow-2xl ${sizeClasses[size]} max-h-[85vh] overflow-hidden flex flex-col animate-fade-in ${className}`}
      >
        {children}
      </div>
    </div>
  )
}

interface ModalHeaderProps {
  title: string
  onClose: () => void
  icon?: string
}

export function ModalHeader({ title, onClose, icon }: ModalHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-editor-border shrink-0">
      <h2 className="text-sm font-semibold text-editor-text">
        {icon && <span className="mr-1">{icon}</span>}
        {title}
      </h2>
      <button
        onClick={onClose}
        className="text-editor-muted hover:text-editor-text p-1 rounded hover:bg-editor-bg transition-colors"
        aria-label="关闭"
      >
        ✕
      </button>
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="px-4 py-3 border-t border-editor-border shrink-0">
      {children}
    </div>
  )
}
