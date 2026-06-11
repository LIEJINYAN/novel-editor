import { useState } from 'react'
import PomodoroTimer from './PomodoroTimer'

export default function PomodoroButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-editor-muted hover:text-editor-text text-sm"
        title="番茄钟"
        aria-label="番茄钟"
      >
        🍅
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 z-50">
          <PomodoroTimer onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}
