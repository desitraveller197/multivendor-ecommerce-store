import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { clearCart } from '../../store/cartSlice'
import PageFrame from '../../components/PageFrame'

const PAYMENT_METHODS = [
  { value: 'Easypaisa', label: 'Card Payment' },
  { value: 'COD', label: 'Cash on Delivery' },
]

/** Luhn checksum — basic validity check for a card number. */
function luhnValid(value) {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let d = Number(digits[i])
    if (alt) {
      d *= 2
      if (d > 9) d -= 9
    }
    sum += d
    alt = !alt
  }
  return sum % 10 === 0
}

function cardBrand(value) {
  const d = value.replace(/\D/g, '')
  if (/^2205/.test(d)) return 'PayPak'
  if (/^4/.test(d)) return 'Visa'
  if (/^(5[1-5]|2[2-7])/.test(d)) return 'Mastercard'
  return 'Card'
}

/** Validate MM/YY expiry: real month, not in the past. */
function expiryValid(value) {
  const m = value.match(/^(\d{2})\s*\/\s*(\d{2})$/)
  if (!m) return false
  const month = Number(m[1])
  const year = 2000 + Number(m[2])
  if (month < 1 || month > 12) return false
  const now = new Date()
  const end = new Date(year, month, 0, 23, 59, 59)
  return end >= now
}

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

  const [paymentMethod, setPaymentMethod] = useState('Easypaisa')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * (item.discountPrice ?? item.price),
    0,
  )

  const updateCard = (field) => (e) => {
    let value = e.target.value
    if (field === 'number') {
      // Group digits in fours for readability.
      value = value.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim()
    } else if (field === 'expiry') {
      const d = value.replace(/\D/g, '').slice(0, 4)
      value = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d
    } else if (field === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4)
    }
    setCard((c) => ({ ...c, [field]: value }))
  }

  const validateCard = () => {
    if (!luhnValid(card.number)) return 'Enter a valid card number.'
    if (!card.name.trim()) return 'Enter the name on the card.'
    if (!expiryValid(card.expiry)) return 'Enter a valid expiry date (MM/YY).'
    if (!/^\d{3,4}$/.test(card.cvv)) return 'Enter a valid CVV.'
    return ''
  }

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
    if (paymentMethod === 'Easypaisa') {
      const cardError = validateCard()
      if (cardError) {
        setError(cardError)
        return
      }
    }

    setLoading(true)
    try {
      if (USE_MOCK) {
        await delay(800)
        dispatch(clearCart())
        navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
        return
      }

      // Only brand + last 4 of the card leave the browser — never the full
      // number or CVV.
      const cardMeta =
        paymentMethod === 'Easypaisa'
          ? { brand: cardBrand(card.number), last4: card.number.replace(/\D/g, '').slice(-4) }
          : undefined

      const res = await axiosInstance.post('/orders', {
        items: cartItems.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.discountPrice ?? item.price,
        })),
        address: { street, city, province, postal },
        paymentMethod,
        card: cardMeta,
      })

      const { payment } = res.data

      if (paymentMethod === 'COD' || payment?.type === 'cod') {
        dispatch(clearCart())
        navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
        return
      }

      // The cart is cleared on the success page after payment completes.
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

  const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500'

  return (
    <PageFrame title="Checkout" description="Enter your shipping details and pay securely to place your order.">
      <div className="grid gap-4 lg:grid-cols-2">
      {/* Shipping & Payment */}
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Shipping Details</h2>
            <div className="grid gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Street</label>
                <input className={inputClass} placeholder="123 Main Street" value={street} onChange={(e) => setStreet(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <input className={inputClass} placeholder="Lahore" value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-slate-700">Province</label>
                  <input className={inputClass} placeholder="Punjab" value={province} onChange={(e) => setProvince(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-slate-700">Postal Code</label>
                <input className={inputClass} placeholder="54000" value={postal} onChange={(e) => setPostal(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="checkout-payment" className="text-sm font-medium text-slate-700">Payment method</label>
            <select
              id="checkout-payment"
              className={inputClass}
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
          </div>

          {paymentMethod === 'Easypaisa' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">Card details</h3>
                <span className="text-xs font-medium text-slate-500">{cardBrand(card.number)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Payment is received in the store's Easypaisa account.
              </p>
              <div className="mt-3 grid gap-3">
                <input
                  className={inputClass}
                  placeholder="Card number"
                  inputMode="numeric"
                  autoComplete="cc-number"
                  value={card.number}
                  onChange={updateCard('number')}
                />
                <input
                  className={inputClass}
                  placeholder="Name on card"
                  autoComplete="cc-name"
                  value={card.name}
                  onChange={updateCard('name')}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    className={inputClass}
                    placeholder="Expiry (MM/YY)"
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    value={card.expiry}
                    onChange={updateCard('expiry')}
                  />
                  <input
                    className={inputClass}
                    placeholder="CVV"
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    value={card.cvv}
                    onChange={updateCard('cvv')}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          {error ? <p className="mb-3 text-xs text-red-500">{error}</p> : null}
          <button
            type="button"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            onClick={handlePlaceOrder}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing…
              </span>
            ) : paymentMethod === 'COD'
              ? 'Place Order'
              : `Pay PKR ${total.toFixed(0)} by Card`}
          </button>
        </div>
      </div>

      {/* Order Summary */}
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Order Summary</h2>
        <ul className="mt-4 divide-y divide-slate-100 text-sm">
          {cartItems.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 py-2">
              <span className="text-slate-700">
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium text-slate-900">
                PKR {((item.discountPrice ?? item.price) * item.quantity).toFixed(0)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-1">
          <p className="text-sm text-slate-600">Items: {cartItems.length}</p>
          <p className="text-sm text-slate-600">
            Payment: {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || paymentMethod}
          </p>
          <p className="text-xl font-bold text-blue-700">Total: PKR {total.toFixed(0)}</p>
        </div>
      </div>
      </div>
    </PageFrame>
  )
}

export default Checkout
