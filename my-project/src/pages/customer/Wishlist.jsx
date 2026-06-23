import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import PageFrame from '../../components/PageFrame'
import { addToCart } from '../../store/cartSlice'
import { removeFromWishlist } from '../../store/wishlistSlice'

function Wishlist() {
  const dispatch = useDispatch()
  const wishlistItems = useSelector((state) => state.wishlist.items)

  return (
    <PageFrame title="Wishlist" description="Items you've saved for later. Add them to your cart anytime.">
      {wishlistItems.length === 0 ? (
        <p className="text-slate-600">Your wishlist is empty. Browse products to add items.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((product) => (
            <div key={product.id} className="space-y-2">
              <ProductCard product={product} onAddToCart={(item) => dispatch(addToCart(item))} />

              <div className="flex items-center gap-2">
                <button
                  className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-sm"
                  onClick={() => dispatch(removeFromWishlist(product.id))}
                >
                  Remove
                </button>
                <button
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
                  onClick={() => dispatch(addToCart(product))}
                >
                  Add to Cart
                </button>
              </div>

              <Link to={`/products/${product.id}`} className="block text-center text-sm font-semibold text-blue-700 transition-colors hover:text-blue-900">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </PageFrame>
  )
}

export default Wishlist
