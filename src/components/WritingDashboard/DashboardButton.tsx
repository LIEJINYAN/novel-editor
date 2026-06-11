import { useState } from 'react'
import WritingDashboard from './WritingDashboard'

export default function DashboardButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-editor-muted hover:text-editor-text text-sm"
        title="写作仪表盘"
        aria-label="写作仪表盘"
      >
        📊
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <WritingDashboard onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
