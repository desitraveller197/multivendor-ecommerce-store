import { useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  joinConversation,
  sendSocketMessage,
} from '../../api/socket'
import {
  addMessage,
  createConversation,
  fetchConversations,
  fetchMessages,
  setActiveConversation,
  setPresenceChange,
  setPresenceState,
  setTyping,
  updateConversationPreview,
} from '../../store/chatSlice'

function typeLabel(type) {
  if (type === 'buyer_seller') return 'Buyer ↔ Seller'
  if (type === 'admin_vendor') return 'Admin ↔ Vendor'
  if (type === 'order') return 'Order Chat'
  return 'Chat'
}

function normalizeId(value) {
  if (value == null) return ''
  if (typeof value === 'object') return String(value.id || value._id || '')
  return String(value)
}

function Messages() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, token, user, role } = useSelector((state) => state.auth)
  const { conversations, activeConversationId, messagesByConversation, typingUsers, onlineUserIds, loading, error: chatError } =
    useSelector((state) => state.chat)

  const [text, setText] = useState('')
  const [localError, setLocalError] = useState('')
  const [socketStatus, setSocketStatus] = useState('connecting')
  const [adminSellers, setAdminSellers] = useState([])
  const messagesEndRef = useRef(null)

  const activeId = normalizeId(activeConversationId)

  const activeConversation = useMemo(
    () => conversations.find((c) => normalizeId(c.id) === activeId),
    [conversations, activeId],
  )

  const activeMessages = messagesByConversation[activeId] || []
  const activeTyping = typingUsers[activeId] || {}

  const onlineSet = useMemo(() => new Set((onlineUserIds || []).map(String)), [onlineUserIds])
  const isUserOnline = (id) => onlineSet.has(normalizeId(id))

  const onlineContactCount = useMemo(() => {
    const contactIds = new Set(
      conversations
        .map((c) => normalizeId(c.otherParticipant?.id))
        .filter((id) => id && onlineSet.has(id)),
    )
    return contactIds.size
  }, [conversations, onlineSet])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    dispatch(fetchConversations())
  }, [dispatch, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || !token) return undefined

    const socket = connectSocket(token)
    if (!socket) {
      setSocketStatus('offline')
      return undefined
    }

    const onConnect = () => setSocketStatus('connected')
    const onDisconnect = () => setSocketStatus('offline')
    const onConnectError = () => setSocketStatus('offline')

    const onNewMessage = (message) => {
      dispatch(
        addMessage({
          conversationId: normalizeId(message.conversationId),
          message,
        }),
      )
    }

    const onConversationUpdated = (payload) => {
      dispatch(
        updateConversationPreview({
          conversationId: normalizeId(payload.conversationId),
          lastMessage: payload.lastMessage,
          lastMessageAt: payload.lastMessageAt,
        }),
      )
    }

    const onTyping = ({ conversationId, userId, name }) => {
      if (normalizeId(userId) !== normalizeId(user?.id)) {
        dispatch(
          setTyping({
            conversationId: normalizeId(conversationId),
            userId,
            name,
            isTyping: true,
          }),
        )
      }
    }

    const onStopTyping = ({ conversationId, userId }) => {
      dispatch(
        setTyping({
          conversationId: normalizeId(conversationId),
          userId,
          isTyping: false,
        }),
      )
    }

    const onChatError = ({ message }) => {
      setLocalError(message || 'Chat error')
    }

    const onPresenceState = (payload) => {
      dispatch(setPresenceState(payload))
    }

    const onPresenceChange = (payload) => {
      dispatch(setPresenceChange(payload))
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('new_message', onNewMessage)
    socket.on('conversation_updated', onConversationUpdated)
    socket.on('typing', onTyping)
    socket.on('stop_typing', onStopTyping)
    socket.on('chat_error', onChatError)
    socket.on('presence_state', onPresenceState)
    socket.on('presence_change', onPresenceChange)

    if (socket.connected) onConnect()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('connect_error', onConnectError)
      socket.off('new_message', onNewMessage)
      socket.off('conversation_updated', onConversationUpdated)
      socket.off('typing', onTyping)
      socket.off('stop_typing', onStopTyping)
      socket.off('chat_error', onChatError)
      socket.off('presence_state', onPresenceState)
      socket.off('presence_change', onPresenceChange)
    }
  }, [dispatch, isAuthenticated, token, user?.id])

  useEffect(() => {
    if (role === 'admin') {
      axiosInstance
        .get('/admin/users?role=seller')
        .then((res) => {
          setAdminSellers((res.data || []).filter((s) => s.status === 'approved'))
        })
        .catch(() => {})
    }
  }, [role])

  useEffect(() => {
    if (!activeId) return undefined

    dispatch(fetchMessages(activeId))
    joinConversation(activeId).catch(() => {})
  }, [activeId, dispatch])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeMessages.length])

  const sendCurrentMessage = async () => {
    if (!text.trim() || !activeId) return
    const trimmed = text.trim()
    setText('')
    setLocalError('')

    try {
      await joinConversation(activeId)

      const socket = getSocket()
      if (socket?.connected) {
        const message = await sendSocketMessage(activeId, trimmed)
        if (message) {
          dispatch(
            addMessage({
              conversationId: activeId,
              message,
            }),
          )
        }
        socket.emit('stop_typing', { conversationId: activeId })
        return
      }

      const res = await axiosInstance.post(`/chat/conversations/${activeId}/messages`, {
        text: trimmed,
      })
      dispatch(
        addMessage({
          conversationId: activeId,
          message: res.data.message,
        }),
      )
    } catch (err) {
      setText(trimmed)
      setLocalError(err.message || 'Failed to send message')
    }
  }

  const handleTyping = (value) => {
    setText(value)
    if (!activeId) return
    const socket = getSocket()
    if (value.trim()) socket?.emit('typing', { conversationId: activeId })
    else socket?.emit('stop_typing', { conversationId: activeId })
  }

  const startAdminVendorChat = async (sellerId) => {
    try {
      const conv = await dispatch(
        createConversation({
          type: 'admin_vendor',
          recipientId: sellerId,
          subject: 'Admin support',
        }),
      ).unwrap()
      dispatch(setActiveConversation(conv.id))
    } catch (err) {
      setLocalError(typeof err === 'string' ? err : 'Could not start chat')
    }
  }

  return (
    <PageFrame
      title="Messages"
      description="Real-time chat for buyers, sellers, admins, and order-related communication."
    >
      {socketStatus === 'offline' ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          Live chat is offline — messages will still send via the server when you click Send.
        </p>
      ) : null}

      {(localError || chatError) ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {localError || chatError}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Conversations</h2>
            {onlineContactCount > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
                {onlineContactCount} online
              </span>
            ) : null}
          </div>
          {loading ? <p className="mt-3 text-sm text-slate-500">Loading…</p> : null}
          <div className="mt-3 max-h-[520px] space-y-2 overflow-y-auto">
            {conversations.map((conv) => {
              const convId = normalizeId(conv.id)
              return (
                <button
                  key={convId}
                  type="button"
                  onClick={() => dispatch(setActiveConversation(convId))}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                    convId === activeId
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-semibold uppercase text-blue-700">{typeLabel(conv.type)}</p>
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                        isUserOnline(conv.otherParticipant?.id) ? 'bg-green-500' : 'bg-slate-300'
                      }`}
                      title={isUserOnline(conv.otherParticipant?.id) ? 'Online' : 'Offline'}
                    />
                    {conv.otherParticipant?.name || conv.subject}
                  </p>
                  <p className="line-clamp-1 text-xs text-slate-500">{conv.lastMessage || 'No messages yet'}</p>
                </button>
              )
            })}
            {conversations.length === 0 && !loading ? (
              <p className="text-sm text-slate-500">No conversations yet.</p>
            ) : null}
          </div>

          {role === 'admin' ? (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Message a vendor</p>
              <div className="mt-2 space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {adminSellers.map((seller) => {
                  const isActive = activeConversation && normalizeId(activeConversation.otherParticipant?.id) === normalizeId(seller.id);
                  return (
                    <button
                      key={seller.id}
                      type="button"
                      onClick={() => startAdminVendorChat(seller.id)}
                      className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'border-blue-300 bg-blue-50 text-blue-700 font-semibold shadow-sm'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-2 w-2 shrink-0 rounded-full ${
                          isUserOnline(seller.id) ? 'bg-green-500' : 'bg-slate-300'
                        }`}
                        title={isUserOnline(seller.id) ? 'Online' : 'Offline'}
                      />
                      {seller.shop ? `${seller.shop} (${seller.name})` : seller.name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </aside>

        <section className="flex min-h-[560px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
          {activeConversation ? (
            <>
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-blue-700">
                  {typeLabel(activeConversation.type)}
                </p>
                <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  {activeConversation.otherParticipant?.name || activeConversation.subject}
                  {activeConversation.otherParticipant?.id ? (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        isUserOnline(activeConversation.otherParticipant.id)
                          ? 'text-green-600'
                          : 'text-slate-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isUserOnline(activeConversation.otherParticipant.id)
                            ? 'bg-green-500'
                            : 'bg-slate-300'
                        }`}
                      />
                      {isUserOnline(activeConversation.otherParticipant.id) ? 'Online' : 'Offline'}
                    </span>
                  ) : null}
                </h3>
                {activeConversation.order ? (
                  <p className="text-xs text-slate-500">
                    Order status: {activeConversation.order.orderStatus || 'N/A'}
                  </p>
                ) : null}
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {activeMessages.map((message) => {
                  const messageId = normalizeId(message.id)
                  const senderId = normalizeId(message.sender?.id || message.sender?._id || message.sender)
                  const isMine = senderId === normalizeId(user?.id)
                  return (
                    <div key={messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                          isMine ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {!isMine ? (
                          <p className="mb-1 text-xs font-semibold opacity-80">
                            {message.sender?.name || 'User'}
                          </p>
                        ) : null}
                        <p>{message.text}</p>
                      </div>
                    </div>
                  )
                })}
                {Object.values(activeTyping).length > 0 ? (
                  <p className="text-xs text-slate-500">
                    {Object.values(activeTyping).join(', ')} is typing…
                  </p>
                ) : null}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-slate-100 p-4">
                <div className="flex gap-2">
                  <input
                    value={text}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        sendCurrentMessage()
                      }
                    }}
                    placeholder="Type your message…"
                    className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={sendCurrentMessage}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
              Select a conversation or start one from a product or order page.
            </div>
          )}
        </section>
      </div>
    </PageFrame>
  )
}

export default Messages
