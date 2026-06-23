import { Link } from 'react-router-dom'

function CheckoutCancel() {
  return (
    <section className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-500">
        ✕
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Payment Cancelled</h1>
      <p className="mt-3 text-sm text-slate-600">Your payment was not completed. No charge was made.</p>
      <Link
        to="/checkout"
        className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
      >
        Back to Checkout
      </Link>
    </section>
  )
}

export default CheckoutCancel
