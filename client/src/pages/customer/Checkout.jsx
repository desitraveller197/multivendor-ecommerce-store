import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { clearCart } from '../../store/cartSlice'
import PageFrame from '../../components/PageFrame'

const PAYMENT_METHODS = [
  { value: 'Stripe', label: 'Card Payment (Stripe)' },
  { value: 'JazzCash', label: 'JazzCash (Mobile Wallet)' },
  { value: 'COD', label: 'Cash on Delivery' },
]

/** Accept any 13–19 digit card number (demo — no strict Luhn check). */
function cardNumberValid(value) {
  const digits = value.replace(/\D/g, '')
  return digits.length >= 13 && digits.length <= 19
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

  const [paymentMethod, setPaymentMethod] = useState('Stripe')
  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [receiptPreview, setReceiptPreview] = useState('')

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.quantity * (item.discountPrice ?? item.price),
    0,
  )
  const [charges, setCharges] = useState({ shipping: 0, tax: 0 })

  const [voucherCode, setVoucherCode] = useState('')
  const [voucherDiscount, setVoucherDiscount] = useState(0)
  const [voucherAppliedCode, setVoucherAppliedCode] = useState('')
  const [voucherError, setVoucherError] = useState('')
  const [voucherSuccess, setVoucherSuccess] = useState('')
  const [verifyingVoucher, setVerifyingVoucher] = useState(false)
  const [voucherPercentage, setVoucherPercentage] = useState(0)

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return
    setVerifyingVoucher(true)
    setVoucherError('')
    setVoucherSuccess('')
    try {
      if (USE_MOCK) {
        await delay(500)
        const mockDiscount = Math.min(1000, Math.round(subtotal * 0.2))
        setVoucherDiscount(mockDiscount)
        setVoucherPercentage(20)
        setVoucherAppliedCode(voucherCode.trim().toUpperCase())
        setVoucherSuccess(`Voucher applied successfully! Discount of PKR ${mockDiscount.toLocaleString()} (20% off).`)
      } else {
        const formattedItems = cartItems.map((item) => ({
          id: item.id || item._id || item.product,
          name: item.name,
          price: item.discountPrice ?? item.price,
          quantity: item.quantity,
          category: item.category || '',
        }))
        const res = await axiosInstance.post('/vouchers/validate', {
          code: voucherCode.trim(),
          cartItems: formattedItems,
          cartTotal: subtotal,
        })
        setVoucherDiscount(res.data.discountAmount)
        setVoucherPercentage(res.data.discountPercentage || 0)
        setVoucherAppliedCode(res.data.code)
        setVoucherSuccess(`Voucher applied successfully! Discount of PKR ${res.data.discountAmount.toLocaleString()} (${res.data.discountPercentage}% off).`)
      }
    } catch (err) {
      setVoucherError(err.response?.data?.message || 'Invalid, expired or ineligible voucher.')
      setVoucherDiscount(0)
      setVoucherPercentage(0)
      setVoucherAppliedCode('')
    } finally {
      setVerifyingVoucher(false)
    }
  }

  const handleRemoveVoucher = () => {
    setVoucherCode('')
    setVoucherDiscount(0)
    setVoucherPercentage(0)
    setVoucherAppliedCode('')
    setVoucherError('')
    setVoucherSuccess('')
  }

  useEffect(() => {
    const fetchCharges = async () => {
      if (cartItems.length === 0) {
        setCharges({ shipping: 0, tax: 0 })
        return
      }
      try {
        const shopGroups = {}
        cartItems.forEach((item) => {
          const id = (item.shop && typeof item.shop === 'object')
            ? (item.shop.id || item.shop._id)
            : item.shop
          if (!id) return

          if (!shopGroups[id]) {
            shopGroups[id] = { itemsPrice: 0 }
          }
          shopGroups[id].itemsPrice += item.quantity * (item.discountPrice ?? item.price)
        })

        if (USE_MOCK) {
          const uniqueShopIds = Object.keys(shopGroups)
          const shipping = uniqueShopIds.length * 200
          setCharges({ shipping, tax: 0 })
        } else {
          let totalShipping = 0
          await Promise.all(
            Object.keys(shopGroups).map(async (id) => {
              const res = await axiosInstance.get(`/shops/${id}`)
              const deliveryCharges = res.data.deliveryCharges || 200
              
              totalShipping += deliveryCharges
            })
          )
          setCharges({ shipping: totalShipping, tax: 0 })
        }
      } catch (err) {
        console.error('Error fetching charges:', err)
        const shopGroups = {}
        cartItems.forEach((item) => {
          const id = (item.shop && typeof item.shop === 'object')
            ? (item.shop.id || item.shop._id)
            : item.shop
          if (!id) return
          if (!shopGroups[id]) {
            shopGroups[id] = { itemsPrice: 0 }
          }
          shopGroups[id].itemsPrice += item.quantity * (item.discountPrice ?? item.price)
        })
        const uniqueShopIds = Object.keys(shopGroups)
        const shipping = uniqueShopIds.length * 200
        setCharges({ shipping, tax: 0 })
      }
    }
    fetchCharges()
  }, [cartItems])

  const finalTotal = Math.max(0, subtotal - voucherDiscount + charges.shipping + charges.tax)

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
    if (!cardNumberValid(card.number)) return 'Enter a valid card number (13–19 digits).'
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
    // No client card validation needed for Stripe Checkout
    if (paymentMethod === 'JazzCash' && !receiptFile) {
      setError('Please upload your JazzCash payment receipt screenshot.')
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

      // 1. Upload screenshot if payment is JazzCash
      let receiptUrl = ''
      if (paymentMethod === 'JazzCash' && receiptFile) {
        const fd = new FormData()
        fd.append('image', receiptFile)
        const uploadRes = await axiosInstance.post('/upload/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        receiptUrl = uploadRes.data.imageUrl
      }

      const res = await axiosInstance.post('/orders', {
        items: cartItems.map((item) => ({
          product: item.id,
          quantity: item.quantity,
          price: item.discountPrice ?? item.price,
        })),
        address: { street, city, province, postal },
        paymentMethod,
        paymentReceipt: receiptUrl,
        voucherCode: voucherAppliedCode,
      })

      const { payment } = res.data

      if (paymentMethod === 'COD' || payment?.type === 'cod' || payment?.type === 'manual_receipt') {
        dispatch(clearCart())
        navigate('/my-orders', { state: { message: payment?.type === 'manual_receipt' ? 'Order placed successfully! Pending payment confirmation.' : 'Order placed successfully!' } })
        return
      }

      // Demo/settled payment — go to the success page within the app.
      if (payment?.type === 'paid') {
        dispatch(clearCart())
        navigate(`/checkout/success?orderId=${res.data.orderId}`)
        return
      }
      // Live gateway — hand off to its hosted page (returns to success page).
      if (payment?.type === 'redirect') {
        postToGateway(payment.postUrl, payment.fields)
        return
      }
      // Stripe Checkout hosted redirect
      if (payment?.type === 'stripe_redirect') {
        dispatch(clearCart())
        window.location.href = payment.url
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {paymentMethod === 'Stripe' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                  Stripe
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Credit / Debit Card</h3>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                You will be redirected to Stripe's secure payment portal to enter card details and complete your order.
              </p>
            </div>
          )}

          {paymentMethod === 'JazzCash' && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#ED1C24] px-2 py-0.5 text-xs font-bold text-white">
                  JazzCash
                </span>
                <h3 className="text-sm font-semibold text-slate-900">Mobile wallet (QR Payment)</h3>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Please scan the QR code in the Order Summary, send the exact order total to our JazzCash account, and upload the payment receipt below.
              </p>
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
              : paymentMethod === 'JazzCash'
                ? 'Paid'
                : `Pay PKR ${finalTotal.toFixed(0)} by Card`}
          </button>

          {/* Upload screenshot section (moved to left side below Paid button) */}
          {paymentMethod === 'JazzCash' && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Upload Payment Receipt Screenshot <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-col items-center gap-3">
                {receiptPreview ? (
                  <div className="relative group max-w-[200px] rounded border border-slate-200 overflow-hidden bg-slate-50">
                    <img src={receiptPreview} alt="Receipt preview" className="w-full h-auto max-h-[150px] object-contain" />
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptFile(null)
                        setReceiptPreview('')
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 text-xs shadow-md transition-colors"
                      title="Remove image"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <span className="text-xl mb-1">📸</span>
                      <p className="text-xs text-slate-500">
                        <span className="font-semibold text-blue-600">Click to upload</span> screenshot
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setReceiptFile(file)
                          setReceiptPreview(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>
          )}
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
        <div className="mt-4 border-t border-slate-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Subtotal ({cartItems.length} items):</span>
            <span className="font-medium text-slate-800">PKR {subtotal.toFixed(0)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-600">
            <span>Delivery Charges:</span>
            <span className="font-medium text-slate-800">PKR {charges.shipping.toFixed(0)}</span>
          </div>
          {voucherDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600 font-semibold">
              <span>Voucher {voucherPercentage}% Off:</span>
              <span>-PKR {voucherDiscount.toFixed(0)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-slate-600 border-t border-dashed border-slate-100 pt-2">
            <span>Payment Mode:</span>
            <span className="font-medium text-slate-800">
              {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label || paymentMethod}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-blue-700 border-t border-slate-200 pt-2">
            <span>Total:</span>
            <span>PKR {finalTotal.toFixed(0)}</span>
          </div>
          {paymentMethod === 'JazzCash' && (
            <div className="mt-4 border-t border-dashed border-slate-200 pt-4">
              <p className="text-xs font-semibold text-slate-700 mb-2 text-center">Scan to Pay via JazzCash / Raast</p>
              <div className="flex justify-center bg-white p-2 rounded-lg border border-slate-100 shadow-sm max-w-[240px] mx-auto">
                <img 
                  src="/images/jazzcash_qr.jpg" 
                  alt="JazzCash QR Code" 
                  className="w-full h-auto rounded"
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500 text-center leading-relaxed">
                Dial <span className="font-semibold">*786*10#</span> and enter Till ID <span className="font-semibold text-slate-700">983722180</span> to pay manually.
              </p>
            </div>
          )}
          <div className="border-t border-slate-100 pt-4 mt-4">
            <label className="block text-sm font-semibold text-slate-800 mb-1.5">Have a Voucher Code?</label>
            {voucherAppliedCode ? (
              <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-200 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-green-700 uppercase">{voucherAppliedCode} applied</span>
                  <span className="text-[10px] text-green-600 font-medium">{voucherPercentage}% discount on items subtotal</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-xs font-semibold text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. VOUCH-ABCD12"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  className="flex-1 rounded border border-slate-300 px-2.5 py-1.5 text-xs uppercase tracking-wider outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  disabled={verifyingVoucher || !voucherCode.trim()}
                  onClick={handleApplyVoucher}
                  className="rounded bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {verifyingVoucher ? '...' : 'Apply'}
                </button>
              </div>
            )}
            {voucherError && <p className="text-[11px] text-red-500 font-medium mt-1">{voucherError}</p>}
            {voucherSuccess && <p className="text-[11px] text-green-600 font-medium mt-1">{voucherSuccess}</p>}
          </div>
        </div>
      </div>
      </div>
    </PageFrame>
  )
}

export default Checkout
