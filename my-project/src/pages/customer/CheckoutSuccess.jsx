import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { clearCart } from '../../store/cartSlice'

function CheckoutSuccess() {
  const dispatch = useDispatch()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')

  useEffect(() => {
    dispatch(clearCart())
  }, [dispatch])

  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Payment successful</h1>
      <p className="mt-3 text-slate-600">Thank you. Your payment went through and your cart was cleared.</p>
      {sessionId ? (
        <p className="mt-2 break-all text-xs text-slate-400">Session: {sessionId}</p>
      ) : null}
      <Link
        to="/products"
        className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Continue shopping
      </Link>
    </section>
  )
}

export default CheckoutSuccess
