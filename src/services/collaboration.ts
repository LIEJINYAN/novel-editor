export interface CollaborationConfig {
  serverUrl: string
  documentId: string
  userId?: string
  userName?: string
}

export interface CollaborationMessage {
  type: string
  [key: string]: any
}

export interface Operation {
  id: string
  documentId: string
  userId: string
  type: 'insert' | 'delete' | 'replace'
  position: number
  content?: string
  length?: number
  timestamp: number
  version: number
}

export interface Collaborator {
  id: string
  name: string
  color: string
  cursor?: {
    position: number
    selection?: { from: number; to: number }
  }
}

type MessageHandler = (message: CollaborationMessage) => void

export class CollaborationService {
  private ws: WebSocket | null = null
  private config: CollaborationConfig
  private handlers: Map<string, MessageHandler[]> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pendingOperations: Operation[] = []
  private userId: string = ''
  private userColor: string = ''

  constructor(config: CollaborationConfig) {
    this.config = config
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.serverUrl)

        this.ws.onopen = () => {
          console.log('Connected to collaboration server')
          this.reconnectAttempts = 0
          this.joinDocument()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('Failed to parse message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('Disconnected from collaboration server')
          this.emit('disconnected', {})
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  on(type: string, handler: MessageHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, [])
    }
    this.handlers.get(type)!.push(handler)
  }

  off(type: string, handler: MessageHandler) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  private emit(type: string, data: any) {
    const handlers = this.handlers.get(type)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  private handleMessage(message: CollaborationMessage) {
    switch (message.type) {
      case 'connected':
        this.userId = message.userId
        this.userColor = message.color
        this.emit('connected', { userId: message.userId, color: message.color })
        break

      case 'document-joined':
        this.emit('document-joined', {
          documentId: message.documentId,
          content: message.content,
          version: message.version,
          collaborators: message.collaborators,
        })
        break

      case 'operation':
        this.emit('operation', { operation: message.operation })
        break

      case 'operation-ack':
        this.handleOperationAck(message.operationId, message.version)
        break

      case 'cursor-update':
        this.emit('cursor-update', {
          userId: message.userId,
          cursor: message.cursor,
        })
        break

      case 'user-joined':
        this.emit('user-joined', { userId: message.userId })
        break

      case 'user-left':
        this.emit('user-left', { userId: message.userId })
        break

      case 'sync-data':
        this.emit('sync-data', {
          documentId: message.documentId,
          content: message.content,
          version: message.version,
        })
        break
    }
  }

  private joinDocument() {
    this.send({
      type: 'join-document',
      documentId: this.config.documentId,
    })
  }

  sendOperation(operation: Omit<Operation, 'id' | 'userId' | 'timestamp' | 'version'>) {
    const fullOperation: Operation = {
      ...operation,
      id: crypto.randomUUID(),
      userId: this.userId,
      timestamp: Date.now(),
      version: 0,
    }

    this.pendingOperations.push(fullOperation)
    this.send({
      type: 'operation',
      operation: fullOperation,
    })
  }

  sendCursorUpdate(cursor: { position: number; selection?: { from: number; to: number } }) {
    this.send({
      type: 'cursor-update',
      cursor,
    })
  }

  requestSync() {
    this.send({
      type: 'request-sync',
    })
  }

  private handleOperationAck(operationId: string, version: number) {
    this.pendingOperations = this.pendingOperations.filter(op => op.id !== operationId)
    this.emit('synced', { version })
  }

  private send(message: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('reconnect-failed', {})
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch(() => {})
    }, delay)
  }

  getUserId() {
    return this.userId
  }

  getUserColor() {
    return this.userColor
  }
}

let instance: CollaborationService | null = null

export function createCollaborationService(config: CollaborationConfig): CollaborationService {
  if (instance) {
    instance.disconnect()
  }
  instance = new CollaborationService(config)
  return instance
}

export function getCollaborationService(): CollaborationService | null {
  return instance
}
