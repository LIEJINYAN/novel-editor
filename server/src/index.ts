import { WebSocketServer, WebSocket } from 'ws'
import { v4 as uuidv4 } from 'uuid'

interface Document {
  id: string
  title: string
  content: string
  version: number
  lastModified: Date
  collaborators: Set<string>
}

interface Operation {
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

interface User {
  id: string
  name: string
  color: string
  cursor?: { position: number; selection?: { from: number; to: number } }
}

const documents = new Map<string, Document>()
const operations = new Map<string, Operation[]>()
const clients = new Map<WebSocket, { userId: string; documentId?: string }>()

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
]

const wss = new WebSocketServer({ port: 8080 })

console.log('WebSocket server running on ws://localhost:8080')

wss.on('connection', (ws) => {
  const userId = uuidv4()
  const userColor = COLORS[Math.floor(Math.random() * COLORS.length)]

  clients.set(ws, { userId })

  ws.send(JSON.stringify({
    type: 'connected',
    userId,
    color: userColor,
  }))

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString())
      handleMessage(ws, message)
    } catch (error) {
      console.error('Invalid message:', error)
    }
  })

  ws.on('close', () => {
    const client = clients.get(ws)
    if (client?.documentId) {
      const doc = documents.get(client.documentId)
      if (doc) {
        doc.collaborators.delete(client.userId)
        broadcastToDocument(client.documentId, {
          type: 'user-left',
          userId: client.userId,
        })
      }
    }
    clients.delete(ws)
  })
})

function handleMessage(ws: WebSocket, message: any) {
  const client = clients.get(ws)
  if (!client) return

  switch (message.type) {
    case 'join-document':
      joinDocument(ws, client, message.documentId)
      break

    case 'operation':
      handleOperation(ws, client, message.operation)
      break

    case 'cursor-update':
      handleCursorUpdate(client, message.cursor)
      break

    case 'request-sync':
      sendSyncData(ws, client.documentId!)
      break
  }
}

function joinDocument(ws: WebSocket, client: { userId: string; documentId?: string }, documentId: string) {
  if (client.documentId) {
    const oldDoc = documents.get(client.documentId)
    if (oldDoc) {
      oldDoc.collaborators.delete(client.userId)
    }
  }

  client.documentId = documentId

  if (!documents.has(documentId)) {
    documents.set(documentId, {
      id: documentId,
      title: 'Untitled',
      content: '',
      version: 0,
      lastModified: new Date(),
      collaborators: new Set(),
    })
    operations.set(documentId, [])
  }

  const doc = documents.get(documentId)!
  doc.collaborators.add(client.userId)

  const collaborators: User[] = []
  for (const [cWs, c] of clients) {
    if (c.documentId === documentId && c.userId !== client.userId) {
      collaborators.push({
        id: c.userId,
        name: `User ${c.userId.slice(0, 8)}`,
        color: COLORS[parseInt(c.userId.slice(0, 8), 16) % COLORS.length],
      })
    }
  }

  ws.send(JSON.stringify({
    type: 'document-joined',
    documentId,
    content: doc.content,
    version: doc.version,
    collaborators,
  }))

  broadcastToDocument(documentId, {
    type: 'user-joined',
    userId: client.userId,
  }, ws)
}

function handleOperation(ws: WebSocket, client: { userId: string; documentId?: string }, operation: Operation) {
  if (!client.documentId) return

  const doc = documents.get(client.documentId)
  if (!doc) return

  operation.id = uuidv4()
  operation.userId = client.userId
  operation.timestamp = Date.now()
  operation.version = doc.version + 1

  const ops = operations.get(client.documentId) || []
  const transformedOp = transformOperation(operation, ops)
  ops.push(transformedOp)
  operations.set(client.documentId, ops.slice(-1000))

  applyOperation(doc, transformedOp)
  doc.version++
  doc.lastModified = new Date()

  broadcastToDocument(client.documentId, {
    type: 'operation',
    operation: transformedOp,
  }, ws)

  ws.send(JSON.stringify({
    type: 'operation-ack',
    operationId: transformedOp.id,
    version: doc.version,
  }))
}

function transformOperation(op: Operation, existingOps: Operation[]): Operation {
  let transformed = { ...op }

  for (const existing of existingOps) {
    if (existing.version >= op.version) continue

    if (op.type === 'insert' && existing.type === 'insert') {
      if (op.position > existing.position) {
        transformed.position += (existing.content?.length || 0)
      } else if (op.position === existing.position && op.id > existing.id) {
        transformed.position += (existing.content?.length || 0)
      }
    } else if (op.type === 'delete' && existing.type === 'insert') {
      if (op.position >= existing.position) {
        transformed.position += (existing.content?.length || 0)
      }
    } else if (op.type === 'insert' && existing.type === 'delete') {
      if (op.position > existing.position) {
        transformed.position -= existing.length || 0
      }
    } else if (op.type === 'delete' && existing.type === 'delete') {
      if (op.position >= existing.position) {
        transformed.position -= existing.length || 0
      }
    }
  }

  return transformed
}

function applyOperation(doc: Document, op: Operation) {
  switch (op.type) {
    case 'insert':
      doc.content = doc.content.slice(0, op.position) + (op.content || '') + doc.content.slice(op.position)
      break
    case 'delete':
      doc.content = doc.content.slice(0, op.position) + doc.content.slice(op.position + (op.length || 0))
      break
    case 'replace':
      doc.content = doc.content.slice(0, op.position) + (op.content || '') + doc.content.slice(op.position + (op.length || 0))
      break
  }
}

function handleCursorUpdate(client: { userId: string; documentId?: string }, cursor: any) {
  if (!client.documentId) return

  broadcastToDocument(client.documentId, {
    type: 'cursor-update',
    userId: client.userId,
    cursor,
  })
}

function sendSyncData(ws: WebSocket, documentId: string) {
  const doc = documents.get(documentId)
  if (!doc) return

  ws.send(JSON.stringify({
    type: 'sync-data',
    documentId,
    content: doc.content,
    version: doc.version,
  }))
}

function broadcastToDocument(documentId: string, message: any, exclude?: WebSocket) {
  for (const [ws, client] of clients) {
    if (client.documentId === documentId && ws !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message))
    }
  }
}
