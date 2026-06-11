import { t } from '../../i18n'
import { WordCountFooter } from '../WordCount/WordCount'
import WordGoalFooter from '../WordGoal/WordGoalFooter'
import AutoSaveIndicator from '../AutoSaveIndicator/AutoSaveIndicator'

interface AppFooterProps {
  isLoaded: boolean
  editor: any
  docCount: number
  onFindReplace: () => void
  onWordCount: () => void
  onWordGoal: () => void
  onOutline: () => void
}

export default function AppFooter({
  isLoaded,
  editor,
  docCount,
  onFindReplace,
  onWordCount,
  onWordGoal,
  onOutline,
}: AppFooterProps) {
  return (
    <footer className="h-6 bg-editor-sidebar border-t border-editor-border flex items-center px-3 text-xs text-editor-muted shrink-0" role="contentinfo" aria-label="状态栏">
      <span>{isLoaded ? t('app.ready') : t('app.loading')}</span>
      <span className="ml-4">
        <WordCountFooter editor={editor} />
      </span>
      <span className="ml-4">
        <WordGoalFooter />
      </span>
      <span className="ml-4">
        <AutoSaveIndicator />
      </span>
      <div className="ml-auto flex items-center gap-2">
        <button
          className="hover:text-editor-text"
          onClick={onFindReplace}
          title={t('editor.findReplace')}
          aria-label={t('editor.findReplace')}
        >
          🔎
        </button>
        <button
          className="hover:text-editor-text"
          onClick={onWordCount}
          title={t('editor.writingStats')}
          aria-label={t('editor.writingStats')}
        >
          📊
        </button>
        <button
          className="hover:text-editor-text"
          onClick={onWordGoal}
          title={t('editor.wordGoal')}
          aria-label={t('editor.wordGoal')}
        >
          🎯
        </button>
        <button
          className="hover:text-editor-text"
          onClick={onOutline}
          title={t('editor.outline')}
          aria-label={t('editor.outline')}
        >
          📑
        </button>
        <span aria-label={`文档数量: ${docCount}`}>
          {docCount}
        </span>
      </div>
    </footer>
  )
}
