import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import { addToCart } from '../../store/cartSlice'
import { removeFromWishlist } from '../../store/wishlistSlice'

function Wishlist() {
  const dispatch = useDispatch()
  const wishlistItems = useSelector((state) => state.wishlist.items)

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Wishlist</h1>

      {wishlistItems.length === 0 ? (
        <p className="mt-4 text-slate-600">Your wishlist is empty. Browse products to add items.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistItems.map((product) => (
            <div key={product.id} className="space-y-2">
              <ProductCard product={product} onAddToCart={(item) => dispatch(addToCart(item))} />

              <div className="flex items-center gap-2">
                <button
                  className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-red-600"
                  onClick={() => dispatch(removeFromWishlist(product.id))}
                >
                  Remove
                </button>
                <button
                  className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-blue-700"
                  onClick={() => dispatch(addToCart(product))}
                >
                  Add to Cart
                </button>
              </div>

              <Link to={`/products/${product.id}`} className="block text-center text-sm font-semibold text-blue-700">
                View Details
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default Wishlist
