import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axiosInstance from '../api/axiosConfig'

function normalizeId(value) {
  if (value == null) return ''
  if (typeof value === 'object') return String(value.id || value._id || '')
  return String(value)
}

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.get('/chat/conversations')
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  },
)

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      const id = normalizeId(conversationId)
      const res = await axiosInstance.get(`/chat/conversations/${id}/messages`)
      return { conversationId: id, messages: res.data }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  },
)

export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosInstance.post('/chat/conversations', payload)
      return res.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message)
    }
  },
)

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    conversations: [],
    activeConversationId: null,
    messagesByConversation: {},
    typingUsers: {},
    onlineUserIds: [],
    loading: false,
    error: null,
  },
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = normalizeId(action.payload)
    },
    addMessage: (state, action) => {
      const conversationId = normalizeId(action.payload.conversationId)
      const message = action.payload.message
      if (!conversationId || !message) return

      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = []
      }
      const exists = state.messagesByConversation[conversationId].some(
        (m) => normalizeId(m.id) === normalizeId(message.id),
      )
      if (!exists) {
        state.messagesByConversation[conversationId].push(message)
      }
      const conv = state.conversations.find((c) => normalizeId(c.id) === conversationId)
      if (conv) {
        conv.lastMessage = message.text
        conv.lastMessageAt = message.createdAt || new Date().toISOString()
      }
    },
    updateConversationPreview: (state, action) => {
      const conversationId = normalizeId(action.payload.conversationId)
      const { lastMessage, lastMessageAt } = action.payload
      const conv = state.conversations.find((c) => normalizeId(c.id) === conversationId)
      if (conv) {
        conv.lastMessage = lastMessage
        conv.lastMessageAt = lastMessageAt
      }
    },
    setTyping: (state, action) => {
      const conversationId = normalizeId(action.payload.conversationId)
      const { userId, name, isTyping } = action.payload
      if (!state.typingUsers[conversationId]) state.typingUsers[conversationId] = {}
      if (isTyping) {
        state.typingUsers[conversationId][normalizeId(userId)] = name
      } else {
        delete state.typingUsers[conversationId][normalizeId(userId)]
      }
    },
    setPresenceState: (state, action) => {
      const online = action.payload?.online || []
      state.onlineUserIds = online.map((entry) =>
        normalizeId(typeof entry === 'object' ? entry.userId : entry),
      )
    },
    setPresenceChange: (state, action) => {
      const userId = normalizeId(action.payload?.userId)
      if (!userId) return
      const isOnline = Boolean(action.payload?.online)
      const has = state.onlineUserIds.includes(userId)
      if (isOnline && !has) {
        state.onlineUserIds.push(userId)
      } else if (!isOnline && has) {
        state.onlineUserIds = state.onlineUserIds.filter((id) => id !== userId)
      }
    },
    prependConversation: (state, action) => {
      const id = normalizeId(action.payload.id)
      const exists = state.conversations.some((c) => normalizeId(c.id) === id)
      if (!exists) state.conversations.unshift({ ...action.payload, id })
    },
    clearChatError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false
        state.conversations = (action.payload || []).map((c) => ({
          ...c,
          id: normalizeId(c.id),
        }))
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messagesByConversation[action.payload.conversationId] = action.payload.messages
      })
      .addCase(createConversation.fulfilled, (state, action) => {
        const id = normalizeId(action.payload.id)
        const exists = state.conversations.some((c) => normalizeId(c.id) === id)
        if (!exists) state.conversations.unshift({ ...action.payload, id })
        state.activeConversationId = id
      })
  },
})

export const {
  setActiveConversation,
  addMessage,
  updateConversationPreview,
  setTyping,
  setPresenceState,
  setPresenceChange,
  prependConversation,
  clearChatError,
} = chatSlice.actions

export default chatSlice.reducer
