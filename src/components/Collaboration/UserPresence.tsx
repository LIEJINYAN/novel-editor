import { useCollaborationStore } from '../../store/collaborationStore'

interface Props {
  onInvite?: () => void
}

export default function UserPresence({ onInvite }: Props) {
  const { collaborators, isConnected } = useCollaborationStore()

  if (!isConnected) return null

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {collaborators.slice(0, 5).map((collaborator) => (
          <div
            key={collaborator.id}
            className="w-6 h-6 rounded-full border-2 border-editor-bg flex items-center justify-center text-[10px] text-white font-medium"
            style={{ backgroundColor: collaborator.color }}
            title={collaborator.name}
          >
            {collaborator.name.charAt(0).toUpperCase()}
          </div>
        ))}
        {collaborators.length > 5 && (
          <div className="w-6 h-6 rounded-full border-2 border-editor-bg bg-editor-muted flex items-center justify-center text-[10px] text-editor-text">
            +{collaborators.length - 5}
          </div>
        )}
      </div>
      <span className="text-xs text-editor-muted">
        {collaborators.length} 人在线
      </span>
      {onInvite && (
        <button
          onClick={onInvite}
          className="text-xs text-editor-accent hover:underline"
        >
          邀请
        </button>
      )}
    </div>
  )
}
