import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { addToCart } from '../../store/cartSlice'
import { addToWishlist, removeFromWishlist } from '../../store/wishlistSlice'
import VariantSelector from '../../components/VariantSelector'
import StarRating from '../../components/StarRating'
import { reviews } from '../../data/mockData'

function ProductDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const products = useSelector((state) => state.products.items)
  const [activeImage, setActiveImage] = useState(0)
  const product = products.find((item) => String(item.id) === id)
  const [size, setSize] = useState('')
  const [quantity, setQuantity] = useState(1)

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
    return [product.image, product.image, product.image]
  }, [product])

  if (!product) {
    return <p className="rounded bg-white p-5 text-slate-600">Product not found.</p>
  }

  const productReviews = reviews.filter((item) => item.productId === product.id)

  return (
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:text-slate-900"
      >
        ← Go Back
      </button>

      <section className="grid gap-6 lg:grid-cols-2">
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

          <div className="mt-6 flex items-center gap-3">
            <button
              className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              onClick={() => dispatch(addToCart({ ...product, selectedSize, quantity }))}
            >
              Add to Cart
            </button>
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

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
          <div className="mt-2 space-y-2">
            {productReviews.map((review) => (
              <div key={review.id} className="rounded border border-slate-200 p-3">
                <p className="font-medium text-slate-800">{review.user}</p>
                <StarRating value={review.rating} />
                <p className="text-sm text-slate-600">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  </div>
  )
}

export default ProductDetail
