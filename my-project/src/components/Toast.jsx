function Toast({ message, type = 'success' }) {
  if (!message) return null

  const tone = type === 'error' ? 'bg-red-600' : type === 'info' ? 'bg-blue-600' : 'bg-emerald-600'

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg px-4 py-3 text-sm text-white ${tone}`}>
      {message}
    </div>
  )
}

export default Toast
