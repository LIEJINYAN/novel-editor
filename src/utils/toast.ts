type ToastType = 'info' | 'success' | 'error' | 'warning'

interface ToastEvent {
  message: string
  type: ToastType
  duration?: number
}

let toastCallback: ((event: ToastEvent) => void) | null = null

export function setToastCallback(callback: (event: ToastEvent) => void) {
  toastCallback = callback
}

export function showToast(message: string, type: ToastType = 'info', duration?: number) {
  if (toastCallback) {
    toastCallback({ message, type, duration })
  }
}

export function showSuccess(message: string) {
  showToast(message, 'success')
}

export function showError(message: string) {
  showToast(message, 'error', 5000)
}

export function showWarning(message: string) {
  showToast(message, 'warning', 4000)
}