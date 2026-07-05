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

  return (
    <article className="relative flex h-[420px] w-full flex-col rounded-lg border border-slate-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <button
        type="button"
        aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-sm ring-1 ring-slate-200 transition hover:bg-white"
        onClick={toggleWishlist}
      >
        {isWishlisted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 text-red-500"
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
            className="h-5 w-5 text-slate-500"
          >
            <path d="M12.001 20.729C6.633 17.573 3 14.314 3 10.75 3 8.014 5.12 6 7.75 6c1.6 0 3.13.76 4.251 2.117C13.122 6.76 14.651 6 16.25 6 18.88 6 21 8.014 21 10.75c0 3.564-3.633 6.823-8.999 9.979Z" />
          </svg>
        )}
      </button>
      <img
        src={product.image}
        alt={product.name}
        className="h-40 w-full shrink-0 rounded-md object-cover transition-transform duration-500 hover:scale-[1.03]"
        onError={(event) => {
          event.currentTarget.src = `https://via.placeholder.com/500x320?text=${encodeURIComponent(
            product.name,
          )}`
        }}
      />
      {linkToDetail ? (
        <Link to={`/products/${product.id}`} className="mt-3 block min-h-[3.5rem]">
          <h3 className="line-clamp-2 text-lg font-semibold text-slate-900 transition-colors hover:text-blue-700">
            {product.name}
          </h3>
        </Link>
      ) : (
        <h3 className="mt-3 line-clamp-2 min-h-[3.5rem] text-lg font-semibold text-slate-900">{product.name}</h3>
      )}
      <p className="mt-1 truncate text-sm text-slate-500">{product.category}</p>
      <p className="mt-2 truncate text-sm text-slate-500">{product.sellerName ?? product.seller}</p>
      <div className="mt-3 flex items-center gap-2">
        <p className="text-xl font-bold text-blue-700">PKR {product.discountPrice ?? product.price}</p>
        {product.discountPrice ? (
          <p className="text-sm text-slate-400 line-through">PKR {product.price}</p>
        ) : null}
      </div>
      {(product.rating > 0 || product.numReviews > 0) ? (
        <div className="mt-2 flex items-center gap-1.5">
          <StarRating value={product.rating || 0} size="sm" showValue />
          {product.numReviews > 0 ? (
            <span className="text-xs text-slate-400">({product.numReviews})</span>
          ) : null}
        </div>
      ) : null}
      <button
        className="mt-auto w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
        onClick={() => onAddToCart(product)}
      >
        Add to Cart
      </button>
    </article>
  )
}

export default ProductCard
