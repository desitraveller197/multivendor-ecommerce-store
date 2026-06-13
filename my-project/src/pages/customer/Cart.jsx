import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
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
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Your Cart</h1>
      <div className="mt-4 space-y-3">
        {cartItems.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-slate-600">Your cart is empty.</p>
            <Link
              to="/products"
              className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={getItemId(item)}
              className="flex items-center justify-between rounded-md border border-slate-200 p-3"
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
                  <p className="font-medium text-slate-800">{item.name}</p>
                  <p className="text-sm text-slate-600">
                    PKR {item.discountPrice ?? item.price} x {item.quantity}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold hover:bg-slate-100"
                  onClick={() => dispatch(decrementQuantity(getItemId(item)))}
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center font-semibold text-slate-800">
                  {item.quantity}
                </span>
                <button
                  className="rounded border border-slate-300 px-2 py-1 text-sm font-semibold hover:bg-slate-100"
                  onClick={() => dispatch(addToCart(item))}
                >
                  +
                </button>
                <button
                  className="rounded-md bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
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
          <p className="mt-5 text-lg font-semibold text-slate-900">
            Total: PKR {total.toFixed(2)}
          </p>
          <Link
            to="/checkout"
            className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Proceed to Checkout
          </Link>
        </>
      )}
    </section>
  )
}

export default Cart
