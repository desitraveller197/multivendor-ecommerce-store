import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { clearCart } from '../../store/cartSlice'

const PAYMENT_METHODS = [
  { value: 'JazzCash', label: 'JazzCash' },
  { value: 'Easypaisa', label: 'Easypaisa' },
  { value: 'COD', label: 'Cash on Delivery' },
]

/** Build and auto-submit a hidden form so the browser POSTs to the gateway's hosted page. */
function postToGateway(postUrl, fields) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = postUrl
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector((state) => state.cart.items)

  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postal, setPostal] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('JazzCash')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * (item.discountPrice ?? item.price),
    0,
  )

  const handlePlaceOrder = async () => {
    setError('')
    if (cartItems.length === 0) {
      setError('Your cart is empty.')
      return
    }
    if (!street || !city || !province || !postal) {
      setError('Please fill out all shipping details.')
      return
    }

    setLoading(true)
    try {
      if (USE_MOCK) {
        await delay(800)
        dispatch(clearCart())
        navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
        return
      }

      const res = await axiosInstance.post('/orders', {
        items: cartItems.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.discountPrice ?? item.price,
        })),
        address: { street, city, province, postal },
        paymentMethod,
      })

      const { payment } = res.data

      if (paymentMethod === 'COD' || payment?.type === 'cod') {
        dispatch(clearCart())
        navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
        return
      }

      // Hand off to the gateway (or the dev simulation). The cart is cleared on
      // the success page after the gateway redirects back.
      if (payment?.type === 'redirect') {
        postToGateway(payment.postUrl, payment.fields)
        return
      }
      if (payment?.type === 'simulate') {
        window.location.assign(payment.url)
        return
      }

      setError('Could not start the payment. Please try again.')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <div className="mt-4 grid gap-3">
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Street"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Province"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Postal Code"
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
          />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
            <select
              className="w-full rounded border border-slate-300 px-3 py-2"
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value)
                setError('')
              }}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {paymentMethod !== 'COD' && (
              <p className="mt-1 text-xs text-slate-500">
                You'll be redirected to {paymentMethod} to complete payment securely.
              </p>
            )}
          </div>
        </div>

        <div className="mt-6">
          {error ? <p className="mb-2 text-sm text-red-600">{error}</p> : null}
          <button
            type="button"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:bg-slate-400 md:w-auto"
            onClick={handlePlaceOrder}
          >
            {loading
              ? 'Processing...'
              : paymentMethod === 'COD'
              ? 'Place Order'
              : `Pay with ${paymentMethod}`}
          </button>
        </div>
      </div>

      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Order summary</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-700">
          {cartItems.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0">
                PKR {((item.discountPrice ?? item.price) * item.quantity).toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-slate-700">Items: {cartItems.length}</p>
        <p className="text-slate-700">Payment: {paymentMethod}</p>
        <p className="mt-2 text-lg font-bold text-blue-700">Total: PKR {total.toFixed(0)}</p>
      </div>
    </section>
  )
}

export default Checkout
