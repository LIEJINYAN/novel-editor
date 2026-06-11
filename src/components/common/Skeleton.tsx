export function EditorSkeleton() {
  return (
    <div className="flex-1 flex flex-col animate-pulse">
      <div className="h-10 bg-editor-surface border-b border-editor-border flex items-center px-4 gap-2">
        <div className="w-8 h-6 bg-editor-border rounded" />
        <div className="w-8 h-6 bg-editor-border rounded" />
        <div className="w-8 h-6 bg-editor-border rounded" />
        <div className="flex-1" />
        <div className="w-20 h-6 bg-editor-border rounded" />
      </div>
      <div className="h-12 bg-editor-surface border-b border-editor-border flex items-center px-4 gap-2">
        <div className="w-16 h-6 bg-editor-border rounded" />
        <div className="w-16 h-6 bg-editor-border rounded" />
        <div className="w-16 h-6 bg-editor-border rounded" />
        <div className="w-16 h-6 bg-editor-border rounded" />
      </div>
      <div className="flex-1 p-8 space-y-4">
        <div className="h-4 bg-editor-border rounded w-3/4" />
        <div className="h-4 bg-editor-border rounded w-1/2" />
        <div className="h-4 bg-editor-border rounded w-2/3" />
        <div className="h-4 bg-editor-border rounded w-1/3" />
        <div className="h-4 bg-editor-border rounded w-3/4" />
        <div className="h-4 bg-editor-border rounded w-1/2" />
      </div>
    </div>
  )
}

export function SidebarSkeleton() {
  return (
    <div className="w-60 bg-editor-sidebar border-r border-editor-border p-3 animate-pulse">
      <div className="h-4 bg-editor-border rounded w-1/2 mb-4" />
      <div className="space-y-2">
        <div className="h-3 bg-editor-border rounded w-full" />
        <div className="h-3 bg-editor-border rounded w-3/4" />
        <div className="h-3 bg-editor-border rounded w-5/6" />
        <div className="h-3 bg-editor-border rounded w-2/3" />
        <div className="h-3 bg-editor-border rounded w-4/5" />
      </div>
      <div className="mt-6 space-y-2">
        <div className="h-3 bg-editor-border rounded w-full" />
        <div className="h-3 bg-editor-border rounded w-3/4" />
        <div className="h-3 bg-editor-border rounded w-5/6" />
      </div>
    </div>
  )
}

export function AIPanelSkeleton() {
  return (
    <div className="w-72 bg-editor-sidebar border-l border-editor-border animate-pulse">
      <div className="p-3 border-b border-editor-border">
        <div className="h-4 bg-editor-border rounded w-1/3" />
      </div>
      <div className="p-3 space-y-3">
        <div className="flex justify-end">
          <div className="h-8 bg-editor-accent/20 rounded-lg w-2/3" />
        </div>
        <div className="flex justify-start">
          <div className="h-12 bg-editor-border rounded-lg w-3/4" />
        </div>
        <div className="flex justify-end">
          <div className="h-10 bg-editor-accent/20 rounded-lg w-1/2" />
        </div>
        <div className="flex justify-start">
          <div className="h-16 bg-editor-border rounded-lg w-2/3" />
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-editor-border">
        <div className="h-10 bg-editor-border rounded" />
      </div>
    </div>
  )
}

export function TabBarSkeleton() {
  return (
    <div className="h-10 bg-editor-sidebar border-b border-editor-border flex items-center px-2 gap-1 animate-pulse">
      <div className="h-6 w-24 bg-editor-border rounded" />
      <div className="h-6 w-20 bg-editor-border rounded" />
      <div className="h-6 w-28 bg-editor-border rounded" />
    </div>
  )
}