import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import PageFrame from '../../components/PageFrame'
import { addToCart } from '../../store/cartSlice'
import { removeFromWishlist } from '../../store/wishlistSlice'

function Wishlist() {
  const dispatch = useDispatch()
  const wishlistItems = useSelector((state) => state.wishlist.items)

  return (
    <div className="mx-auto max-w-5xl px-2 sm:px-6 lg:px-10">
    <PageFrame title="Wishlist" description="Items you've saved for later. Add them to your cart anytime.">
      {wishlistItems.length === 0 ? (
        <p className="text-slate-600">Your wishlist is empty. Browse products to add items.</p>
      ) : (
        <div className="space-y-3">
          {wishlistItems.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-md"
            >
              <Link to={`/products/${product.id}`} className="shrink-0">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-20 w-20 rounded-md object-cover"
                  onError={(event) => {
                    event.currentTarget.src = `https://via.placeholder.com/160?text=${encodeURIComponent(product.name)}`
                  }}
                />
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  to={`/products/${product.id}`}
                  className="line-clamp-1 font-semibold text-slate-900 hover:text-blue-700"
                  title={product.name}
                >
                  {product.name}
                </Link>
                <p className="truncate text-xs text-slate-500">{product.category}</p>
                <p className="mt-1 font-bold text-blue-700">
                  PKR {product.discountPrice ?? product.price}
                  {product.discountPrice ? (
                    <span className="ml-2 text-xs font-normal text-slate-400 line-through">
                      PKR {product.price}
                    </span>
                  ) : null}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                  onClick={() => dispatch(addToCart(product))}
                >
                  Add to Cart
                </button>
                <button
                  className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-sm"
                  onClick={() => dispatch(removeFromWishlist(product.id))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageFrame>
    </div>
  )
}

export default Wishlist
