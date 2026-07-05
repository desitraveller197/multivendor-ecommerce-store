import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createConversation, setActiveConversation } from '../store/chatSlice'

function resolveRecipientId(recipientId) {
  if (!recipientId) return null
  if (typeof recipientId === 'object') {
    return recipientId.id || recipientId._id || null
  }
  return recipientId
}

function StartChatButton({
  recipientId,
  type = 'buyer_seller',
  orderId = null,
  productId = null,
  subject = '',
  label = 'Message Seller',
  className = '',
}) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const resolvedRecipientId = resolveRecipientId(recipientId)

  if (!resolvedRecipientId || String(resolvedRecipientId) === String(user?.id)) return null

  const handleClick = async () => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    setLoading(true)
    setError('')
    try {
      const conv = await dispatch(
        createConversation({
          type,
          recipientId: resolvedRecipientId,
          orderId,
          productId,
          subject,
        }),
      ).unwrap()
      dispatch(setActiveConversation(conv.id))
      navigate('/messages')
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Could not start chat. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={
          className ||
          'rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60'
        }
      >
        {loading ? 'Opening chat…' : label}
      </button>
      {error ? <span className="text-xs text-red-500">{error}</span> : null}
    </div>
  )
}

export default StartChatButton
