import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { clearCart } from '../../store/cartSlice'

const stripePk =
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
  'pk_test_placeholder'

const stripePromise = loadStripe(stripePk)

function StripePayBlock({ paymentError, setPaymentError, loading, setLoading }) {
  const stripe = useStripe()
  const elements = useElements()

  async function confirmStripePayment() {
    if (!stripe || !elements || loading) return
    setPaymentError('')
    setLoading(true)
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/my-orders?stripe_success=1`,
      },
    })
    if (error) {
      setPaymentError(error.message)
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mt-4">
        <PaymentElement />
      </div>
      {paymentError ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {paymentError}
        </p>
      ) : null}
      <div className="mt-3">
        {loading ? (
          <button
            type="button"
            disabled
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white opacity-80"
          >
            Processing...
          </button>
        ) : (
          <button
            type="button"
            disabled={!stripe || !elements}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
            onClick={confirmStripePayment}
          >
            Place Order
          </button>
        )}
      </div>
    </>
  )
}

function Checkout() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const cartItems = useSelector((state) => state.cart.items)

  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [postal, setPostal] = useState('')

  const [paymentMethod, setPaymentMethod] = useState('Stripe')
  const [clientSecret, setClientSecret] = useState('')
  const [orderId, setOrderId] = useState('')
  const [intentError, setIntentError] = useState('')
  const [intentLoading, setIntentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  const [loading, setLoading] = useState(false)

  const total = cartItems.reduce((sum, item) => sum + item.quantity * (item.discountPrice ?? item.price), 0)

  const resetPayment = () => {
    setClientSecret('')
    // Keep orderId so we can update the existing order instead of creating duplicates
    setIntentError('')
  }

  const handleConfirmAddress = async () => {
    if (!street || !city || !province || !postal) {
      setIntentError('Please fill out all shipping details.')
      return
    }
    setIntentLoading(true)
    setIntentError('')
    try {
      if (USE_MOCK) {
        await delay(800)
        setClientSecret('mock_secret_not_real')
        setOrderId('ORD-MOCK-001')
      } else {
        const res = await axiosInstance.post('/orders', {
          items: cartItems.map((item) => ({
            product: item.id,
            quantity: item.quantity,
            price: item.discountPrice ?? item.price,
          })),
          address: { street, city, province, postal },
          paymentMethod: 'Stripe',
          orderId: orderId || undefined,
        })
        setClientSecret(res.data.clientSecret)
        setOrderId(res.data.orderId)
      }
    } catch (_err) {
      setIntentError('Could not initialize payment. Please try again.')
      setClientSecret('')
      setOrderId('')
    } finally {
      setIntentLoading(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      setPaymentError('')
      setIntentError('Your cart is empty.')
      return
    }
    setPaymentError('')
    setIntentError('')

    if (paymentMethod === 'COD') {
      setLoading(true)
      try {
        if (USE_MOCK) {
          await delay(500)
          dispatch(clearCart())
          navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
        } else {
          await axiosInstance.post('/orders', {
            items: cartItems.map((item) => ({
              product: item.id,
              quantity: item.quantity,
              price: item.discountPrice ?? item.price,
            })),
            address: { street, city, province, postal },
            paymentMethod: 'COD',
          })
          dispatch(clearCart())
          navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
        }
      } catch (err) {
        setPaymentError(err.response?.data?.message || 'Failed to place order. Please try again.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (USE_MOCK) {
      setLoading(true)
      await delay(1000)
      dispatch(clearCart())
      navigate('/my-orders', { state: { message: 'Order placed successfully!' } })
      setLoading(false)
    }
    // Live Stripe confirms inside StripePayBlock
  }

  const showStripeElements = Boolean(clientSecret) && USE_MOCK === false && paymentMethod === 'Stripe'

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>
        <div className="mt-4 grid gap-3">
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Street"
            value={street}
            onChange={(e) => {
              setStreet(e.target.value)
              resetPayment()
            }}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="City"
            value={city}
            onChange={(e) => {
              setCity(e.target.value)
              resetPayment()
            }}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Province"
            value={province}
            onChange={(e) => {
              setProvince(e.target.value)
              resetPayment()
            }}
          />
          <input
            className="rounded border border-slate-300 px-3 py-2"
            placeholder="Postal Code"
            value={postal}
            onChange={(e) => {
              setPostal(e.target.value)
              resetPayment()
            }}
          />
          <select
            className="rounded border border-slate-300 px-3 py-2"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value)
              setPaymentError('')
              setIntentError('')
              resetPayment()
            }}
          >
            <option value="Stripe">Stripe</option>
            <option value="COD">Cash on Delivery</option>
          </select>
        </div>

        {paymentMethod === 'Stripe' && !clientSecret && (
          <div className="mt-6">
            {intentError ? <p className="mb-2 text-sm text-red-600">{intentError}</p> : null}
            <button
              type="button"
              disabled={intentLoading}
              onClick={handleConfirmAddress}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:bg-slate-400 md:w-auto"
            >
              {intentLoading ? 'Initializing payment...' : 'Proceed to Payment'}
            </button>
          </div>
        )}

        {paymentMethod === 'Stripe' && clientSecret && (
          <>
            {intentLoading && (
              <p className="mt-4 text-sm text-slate-500">Initializing payment...</p>
            )}
            {!intentLoading && intentError ? (
              <p className="mt-4 text-sm text-red-600">{intentError}</p>
            ) : null}
            {USE_MOCK && clientSecret && !intentLoading ? (
              <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  [Mock Mode] Payment form skipped. Click Place Order to simulate success.
                </p>
              </div>
            ) : null}
            {!USE_MOCK && clientSecret ? (
              <Elements
                key={clientSecret}
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: 'stripe', variables: { colorPrimary: '#2563eb' } },
                }}
              >
                {!intentLoading ? (
                  <div className="mt-4">
                    <StripePayBlock
                      paymentError={paymentError}
                      setPaymentError={setPaymentError}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  </div>
                ) : null}
              </Elements>
            ) : null}
          </>
        )}

        {(paymentMethod === 'COD' || (paymentMethod === 'Stripe' && USE_MOCK && clientSecret)) && (
          <div className="mt-6">
            {paymentError ? <p className="mb-2 text-sm text-red-600">{paymentError}</p> : null}
            <button
              type="button"
              disabled={
                loading ||
                intentLoading ||
                (paymentMethod === 'Stripe' && USE_MOCK && !clientSecret)
              }
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:bg-slate-400 md:w-auto"
              onClick={handlePlaceOrder}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        )}
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
        {orderId ? <p className="text-xs text-slate-400">Order ref: {orderId}</p> : null}
        <p className="mt-2 text-lg font-bold text-blue-700">Total: PKR {total.toFixed(0)}</p>
      </div>
    </section>
  )
}

export default Checkout
