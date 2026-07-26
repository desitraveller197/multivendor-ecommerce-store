import { io } from 'socket.io-client'

let socket = null

export function getSocket() {
  return socket
}

export function isSocketConnected() {
  return Boolean(socket?.connected)
}

export function connectSocket(token) {
  if (!token) return null

  if (socket?.connected) return socket

  if (socket) {
    socket.disconnect()
    socket = null
  }

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')

  socket = io(baseUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function joinConversation(conversationId) {
  return new Promise((resolve) => {
    if (!socket?.connected || !conversationId) {
      resolve(false)
      return
    }

    socket.emit('join_conversation', { conversationId: String(conversationId) }, (result) => {
      resolve(result?.ok === true)
    })

    setTimeout(() => resolve(false), 3000)
  })
}

export function sendSocketMessage(conversationId, text) {
  return new Promise((resolve, reject) => {
    if (!socket?.connected) {
      reject(new Error('Socket not connected'))
      return
    }

    socket.emit(
      'send_message',
      { conversationId: String(conversationId), text },
      (result) => {
        if (result?.error) {
          reject(new Error(result.error))
          return
        }
        resolve(result?.message || null)
      },
    )

    setTimeout(() => reject(new Error('Message send timed out')), 5000)
  })
}
