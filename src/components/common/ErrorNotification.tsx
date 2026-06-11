import { useState, useCallback, createContext, useContext, useEffect } from 'react'

interface Error {
  id: string
  message: string
  type: 'error' | 'warning' | 'info'
  timestamp: number
}

interface ErrorContextType {
  errors: Error[]
  addError: (message: string, type?: Error['type']) => void
  removeError: (id: string) => void
  clearErrors: () => void
}

const ErrorContext = createContext<ErrorContextType | null>(null)

export function useError() {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within ErrorProvider')
  }
  return context
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<Error[]>([])

  const addError = useCallback((message: string, type: Error['type'] = 'error') => {
    const id = `error_${Date.now()}`
    setErrors((prev) => [...prev, { id, message, type, timestamp: Date.now() }])
  }, [])

  const removeError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors((prev) => prev.slice(1))
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [errors])

  return (
    <ErrorContext.Provider value={{ errors, addError, removeError, clearErrors }}>
      {children}
      <ErrorToast errors={errors} onRemove={removeError} />
    </ErrorContext.Provider>
  )
}

function ErrorToast({ errors, onRemove }: { errors: Error[]; onRemove: (id: string) => void }) {
  if (errors.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {errors.slice(0, 3).map((error) => (
        <div
          key={error.id}
          className={`flex items-start gap-2 p-3 rounded-lg shadow-lg border animate-slide-in ${
            error.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-500'
              : error.type === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-500'
          }`}
        >
          <span className="text-sm">
            {error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <p className="text-xs flex-1">{error.message}</p>
          <button
            onClick={() => onRemove(error.id)}
            className="text-current opacity-50 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
