import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import PageFrame from '../../components/PageFrame'
import { addToCart, decrementQuantity, removeFromCart } from '../../store/cartSlice'

function Cart() {
  const dispatch = useDispatch()
  const cartItems = useSelector((state) => state.cart.items)
  const total = cartItems.reduce(
    (sum, item) => sum + (item.discountPrice ?? item.price) * item.quantity,
    0,
  )

  const getItemId = (item) => item._id || item.id

  return (
    <PageFrame title="Your Cart" description="Review your items, adjust quantities, and proceed to checkout.">
      <section className="rounded-lg bg-white p-6 shadow-sm">
      <div className="space-y-3">
        {cartItems.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-600">Your cart is empty.</p>
            <Link
              to="/products"
              className="mt-4 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={getItemId(item)}
              className="flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-14 w-14 rounded-md object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                )}
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-sm text-blue-700 font-bold">
                    PKR {item.discountPrice ?? item.price} × {item.quantity}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => dispatch(decrementQuantity(getItemId(item)))}
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center font-semibold text-slate-900">
                  {item.quantity}
                </span>
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                  onClick={() => dispatch(addToCart(item))}
                >
                  +
                </button>
                <button
                  className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-sm"
                  onClick={() => dispatch(removeFromCart(getItemId(item)))}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <>
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <p className="text-lg font-bold text-slate-900">
              Total: <span className="text-blue-700">PKR {total.toFixed(0)}</span>
            </p>
            <Link
              to="/checkout"
              className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              Proceed to Checkout →
            </Link>
          </div>
        </>
      )}
      </section>
    </PageFrame>
  )
}

export default Cart
