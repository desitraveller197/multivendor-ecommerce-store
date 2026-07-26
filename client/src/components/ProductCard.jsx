import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { addToWishlist, removeFromWishlist } from '../store/wishlistSlice'
import StarRating from './StarRating'

function ProductCard({ product, onAddToCart, linkToDetail = false }) {
  const dispatch = useDispatch()
  const wishlistItems = useSelector((state) => state.wishlist.items)
  const isWishlisted = wishlistItems.some((item) => item.id === product.id)

  const toggleWishlist = () => {
    if (isWishlisted) {
      dispatch(removeFromWishlist(product.id))
    } else {
      dispatch(addToWishlist(product))
    }
  }

  const discountPercent = product.price > 0 && product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <article className="card-hover-glow relative flex h-[310px] sm:h-[415px] w-full flex-col justify-between rounded-xl border border-slate-100 bg-white p-2.5 sm:p-4 shadow-sm">
      {product.discountEvent && (
        <div className="absolute left-2 top-2 z-10 rounded bg-red-600 px-1.5 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
          🔥 {product.discountEvent}
        </div>
      )}
      <button
        type="button"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className={`absolute right-2 top-2 z-10 rounded-full bg-white/90 p-1.5 sm:p-2 shadow-sm ring-1 ring-slate-200 transition hover:bg-white ${
          isWishlisted ? 'animate-heart-beat text-red-500' : 'text-slate-500'
        }`}
        onClick={toggleWishlist}
      >
        {isWishlisted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4 sm:h-5 sm:w-5 text-red-500"
          >
            <path d="M11.645 20.91a.75.75 0 0 0 .71 0C17.93 17.764 21 14.465 21 10.75 21 7.91 18.75 6 16.25 6c-1.57 0-3.08.73-4.25 2.09C10.83 6.73 9.32 6 7.75 6 5.25 6 3 7.91 3 10.75c0 3.715 3.07 7.014 8.645 10.16Z" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500"
          >
            <path d="M12.001 20.729C6.633 17.573 3 14.314 3 10.75 3 8.014 5.12 6 7.75 6c1.6 0 3.13.76 4.251 2.117C13.122 6.76 14.651 6 16.25 6 18.88 6 21 8.014 21 10.75c0 3.564-3.633 6.823-8.999 9.979Z" />
          </svg>
        )}
      </button>

      <div>
        <img
          src={product.image || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='320' viewBox='0 0 500 320'%3E%3Crect width='500' height='320' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3E📦 Product Image%3C/text%3E%3C/svg%3E"}
          alt={product.name || 'Product'}
          className="h-28 sm:h-40 w-full shrink-0 rounded-md object-cover transition-transform duration-500 hover:scale-[1.03]"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='320' viewBox='0 0 500 320'%3E%3Crect width='500' height='320' fill='%23f1f5f9'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3E📦 Product Image%3C/text%3E%3C/svg%3E"
          }}
        />
        {linkToDetail ? (
          <Link to={`/products/${product.id}`} className="mt-1.5 sm:mt-3 block min-h-[2rem] sm:min-h-[3.25rem]">
            <h3 className="line-clamp-2 text-xs sm:text-base font-semibold text-slate-900 transition-colors hover:text-blue-700">
              {product.name}
            </h3>
          </Link>
        ) : (
          <h3 className="mt-1.5 sm:mt-3 line-clamp-2 min-h-[2rem] sm:min-h-[3.25rem] text-xs sm:text-base font-semibold text-slate-900">{product.name}</h3>
        )}
        <p className="truncate text-[10px] sm:text-xs text-slate-500 mt-0.5">{product.sellerName ?? product.seller ?? product.category}</p>
        
        <div className="mt-1 sm:mt-2 flex flex-wrap items-baseline gap-1 overflow-hidden text-ellipsis">
          <p className="text-xs sm:text-base font-bold text-blue-700">PKR {product.discountPrice ?? product.price}</p>
          {product.discountPrice ? (
            <>
              <p className="text-[10px] sm:text-xs text-slate-400 line-through">PKR {product.price}</p>
              {discountPercent > 0 && (
                <span className="text-[9px] sm:text-[10px] font-bold text-green-600">({discountPercent}% OFF)</span>
              )}
            </>
          ) : null}
        </div>

        <div className="mt-1 flex items-center justify-between min-h-[1rem]">
          {product.stock > 0 ? (
            <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[9px] sm:text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              In Stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[9px] sm:text-xs font-medium text-red-700">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              Out of Stock
            </span>
          )}
          {(product.rating > 0 || product.numReviews > 0) ? (
            <div className="flex items-center gap-1">
              <StarRating value={product.rating || 0} size="sm" showValue />
              {product.numReviews > 0 ? (
                <span className="text-[9px] sm:text-xs text-slate-400">({product.numReviews})</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <button
        disabled={product.stock <= 0}
        className="btn-interactive mt-2 sm:mt-3 w-full rounded-md bg-blue-600 px-2 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
        onClick={() => onAddToCart(product)}
      >
        {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
      </button>
    </article>
  )
}

export default ProductCard
