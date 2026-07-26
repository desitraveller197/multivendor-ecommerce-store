import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import { clearCart } from '../../store/cartSlice'

function CheckoutSuccess() {
  const dispatch = useDispatch()
  const [params] = useSearchParams()
  const orderId = params.get('orderId')

  useEffect(() => {
    dispatch(clearCart())
  }, [dispatch])

  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Payment Successful</h1>
      <p className="mt-3 text-sm text-slate-600">Thank you! Your payment went through and your cart was cleared.</p>
      {orderId ? (
        <p className="mt-2 break-all text-xs text-slate-400">Order ref: {orderId}</p>
      ) : null}
      <div className="mt-6 flex justify-center gap-3">
        <Link
          to="/my-orders"
          className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
        >
          View My Orders
        </Link>
        <Link
          to="/products"
          className="inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
        >
          Continue Shopping
        </Link>
      </div>
    </section>
  )
}

export default CheckoutSuccess
