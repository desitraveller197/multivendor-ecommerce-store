import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { addToCart } from '../../store/cartSlice'
import { addToWishlist, removeFromWishlist } from '../../store/wishlistSlice'
import VariantSelector from '../../components/VariantSelector'
import StarRating from '../../components/StarRating'
import StartChatButton from '../../components/StartChatButton'
import axiosInstance from '../../api/axiosConfig'
import RevealOnScroll from '../../components/RevealOnScroll'

function ProductDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { isAuthenticated } = useSelector((state) => state.auth)
  const products = useSelector((state) => state.products.items)
  const [activeImage, setActiveImage] = useState(0)
  const product = products.find((item) => String(item.id) === id)
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [productReviews, setProductReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(true)

  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')
  const [reviewSubmitting, setReviewSubmitting] = useState(false)

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    setReviewSubmitting(true)
    setReviewError('')
    setReviewSuccess('')
    try {
      if (USE_MOCK) {
        await delay(500)
        setReviewSuccess('Review submitted successfully!')
        setProductReviews((prev) => [
          {
            id: Date.now().toString(),
            customerName: 'You',
            rating,
            comment,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ])
      } else {
        const res = await axiosInstance.post(`/reviews/product/${id}`, { rating, comment })
        setReviewSuccess('Review submitted successfully!')
        setProductReviews((prev) => [res.data, ...prev])
      }
      setComment('')
      setRating(5)
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.')
    } finally {
      setReviewSubmitting(false)
    }
  }

  useEffect(() => {
    if (!id) return
    let cancelled = false

    async function loadReviews() {
      setReviewsLoading(true)
      try {
        const res = await axiosInstance.get(`/reviews/product/${id}`)
        if (!cancelled) setProductReviews(res.data || [])
      } catch {
        if (!cancelled) setProductReviews([])
      } finally {
        if (!cancelled) setReviewsLoading(false)
      }
    }

    loadReviews()
    return () => {
      cancelled = true
    }
  }, [id])

  // Cap the quantity at available stock when the product tracks it.
  const maxQty = product?.stock > 0 ? product.stock : 99
  const changeQty = (delta) =>
    setQuantity((q) => Math.min(maxQty, Math.max(1, q + delta)))

  // Sizes the seller made available for this product (schema variants).
  const sizeOptions = useMemo(
    () => (product?.variants || []).map((v) => v.size).filter(Boolean),
    [product],
  )
  const selectedSize = size && sizeOptions.includes(size) ? size : sizeOptions[0] || ''

  const wishlistItems = useSelector((state) => state.wishlist.items)
  const isWishlisted = wishlistItems.some((item) => item.id === product?.id)

  const toggleWishlist = () => {
    if (product) {
      if (isWishlisted) {
        dispatch(removeFromWishlist(product.id))
      } else {
        dispatch(addToWishlist(product))
      }
    }
  }


  const images = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images
    }
    return [product.image].filter(Boolean)
  }, [product])

  if (!product) {
    return <p className="rounded bg-white p-5 text-slate-600">Product not found.</p>
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
      >
        ← Go Back
      </button>

      <RevealOnScroll className="grid gap-6 lg:grid-cols-2" as="section">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <img
            src={images[activeImage]}
            alt={product.name}
            className="h-80 w-full rounded-md object-cover"
          />
          <div className="mt-3 flex gap-2">
            {images.map((image, index) => (
              <button key={image + index} onClick={() => setActiveImage(index)}>
                <img src={image} alt="thumbnail" className="h-16 w-16 rounded object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StarRating value={product.rating || 0} size="md" showValue />
            <span className="text-sm text-slate-500">({product.numReviews || 0} reviews)</span>
          </div>
          <p className="mt-2 text-slate-600">{product.description}</p>
          <p className="mt-4 text-2xl font-bold text-blue-700">PKR {product.discountPrice}</p>
          {sizeOptions.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-sm text-slate-500">Select size</p>
              <VariantSelector
                options={sizeOptions}
                selected={selectedSize}
                onChange={setSize}
              />
            </div>
          )}
          <div className="mt-4 flex items-center gap-3">
            <span className="text-sm text-slate-500">Quantity</span>
            <div className="inline-flex items-center rounded-md border border-slate-300">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="grid h-7 w-7 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                onClick={() => changeQty(-1)}
                disabled={quantity <= 1}
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-medium text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="grid h-7 w-7 place-items-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                onClick={() => changeQty(1)}
                disabled={quantity >= maxQty}
              >
                +
              </button>
            </div>
            {product.stock > 0 && (
              <span className="text-xs text-slate-400">{product.stock} in stock</span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              onClick={() => dispatch(addToCart({ ...product, selectedSize, quantity }))}
            >
              Add to Cart
            </button>
            <StartChatButton
              recipientId={product.seller}
              type="buyer_seller"
              productId={product.id}
              subject={`About ${product.name}`}
              label="Message Seller"
            />
            <button
              className={`rounded-md border px-5 py-2 text-sm font-semibold shadow-sm transition ${
                isWishlisted
                  ? 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
              }`}
              onClick={toggleWishlist}
            >
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

        <RevealOnScroll className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
          {isAuthenticated && (
            <form onSubmit={handleReviewSubmit} className="mt-3 rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-slate-800">Write a Review</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-xl transition ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <textarea
                  required
                  rows={2}
                  disabled={reviewSubmitting}
                  placeholder="Describe your purchase and shopping experience..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white"
                />
              </div>
              {reviewSuccess && <p className="text-xs text-green-600 font-semibold">{reviewSuccess}</p>}
              {reviewError && <p className="text-xs text-red-500 font-semibold">{reviewError}</p>}
              <button
                type="submit"
                disabled={reviewSubmitting || !comment.trim()}
                className="rounded bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </form>
          )}
          {reviewsLoading ? (
            <p className="mt-3 text-sm text-slate-500">Loading reviews…</p>
          ) : productReviews.length > 0 ? (
            <div className="mt-3 space-y-3">
              {productReviews.map((review) => (
                <div key={review.id} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-slate-800">{review.customerName || 'Customer'}</p>
                    <StarRating value={review.rating} size="md" showValue />
                  </div>
                  {review.title ? (
                    <p className="mt-2 text-sm font-medium text-slate-700">{review.title}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-600">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No reviews yet for this product.</p>
          )}
        </RevealOnScroll>
      </div>
    </RevealOnScroll>
  </div>
  )
}

export default ProductDetail
