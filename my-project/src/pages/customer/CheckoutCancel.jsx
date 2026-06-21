import { Link } from 'react-router-dom'

function CheckoutCancel() {
  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Payment cancelled</h1>
      <p className="mt-3 text-slate-600">Your payment was not completed. No charge was made.</p>
      <Link
        to="/checkout"
        className="mt-6 inline-block rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
      >
        Back to checkout
      </Link>
    </section>
  )
}

export default CheckoutCancel
