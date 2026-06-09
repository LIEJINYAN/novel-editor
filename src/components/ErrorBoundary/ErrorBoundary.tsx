import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('组件错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex-1 flex items-center justify-center p-4 text-editor-muted">
            <div className="text-center max-w-md">
              <p className="text-lg mb-2">⚠️ 组件加载失败</p>
              <p className="text-sm mb-4">{this.state.error?.message}</p>
              <button
                className="px-4 py-2 bg-editor-accent text-white rounded hover:opacity-90"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                重试
              </button>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
