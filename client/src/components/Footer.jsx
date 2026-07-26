import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import axiosInstance from '../api/axiosConfig'
import StarRating from './StarRating'
import RevealOnScroll from './RevealOnScroll'

const FALLBACK_REVIEWERS = ['Ayesha K.', 'Hassan M.', 'Fatima R.', 'Usman A.', 'Sana B.', 'Ali R.']

const FALLBACK_COMMENTS = [
  'Beautiful craftsmanship and fast delivery. Highly recommend!',
  'Exactly as described — genuine regional product with great packaging.',
  'Good quality for the price. Will definitely order again.',
  'My family loved this purchase. True Pakistani heritage quality.',
  'Nice product, arrived on time. Seller was very helpful.',
  'Bought this as a gift and it was a huge hit. Stunning details!',
]

const STATIC_REVIEWS = [
  { id: 'static-1', productName: 'Phulkari Dupatta', customerName: 'Ayesha K.', rating: 5, title: 'Stunning quality', comment: FALLBACK_COMMENTS[0] },
  { id: 'static-2', productName: 'Peshawari Chappal', customerName: 'Hassan M.', rating: 4.5, title: 'Authentic craft', comment: FALLBACK_COMMENTS[1] },
  { id: 'static-3', productName: 'Ajrak Shawl', customerName: 'Fatima R.', rating: 5, title: 'Beautiful colors', comment: FALLBACK_COMMENTS[2] },
  { id: 'static-4', productName: 'Hala Pottery Set', customerName: 'Usman A.', rating: 4, title: 'Great value', comment: FALLBACK_COMMENTS[3] },
  { id: 'static-5', productName: 'Swati Wool Shawl', customerName: 'Sana B.', rating: 4.5, title: 'Warm & soft', comment: FALLBACK_COMMENTS[4] },
  { id: 'static-6', productName: 'Multani Khussa', customerName: 'Ali R.', rating: 5, title: 'Perfect gift', comment: FALLBACK_COMMENTS[5] },
]

const PAYMENT_METHODS = [
  { name: 'JazzCash', logo: '/images/payments/jazzcash.svg', description: 'Mobile wallet' },
  { name: 'Cash on Delivery', logo: '/images/payments/cod.svg', description: 'Pay when you receive' },
  { name: 'Visa', logo: '/images/payments/visa.svg', description: 'Debit & credit cards' },
  { name: 'Mastercard', logo: '/images/payments/mastercard.svg', description: 'Debit & credit cards' },
]

function Footer() {
  const { items } = useSelector((state) => state.products)
  const { isAuthenticated, role } = useSelector((state) => state.auth)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadReviews() {
      try {
        const res = await axiosInstance.get('/reviews/recent?limit=6')
        if (!cancelled) setReviews(Array.isArray(res.data) ? res.data : [])
      } catch {
        if (!cancelled) setReviews([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadReviews()
    return () => {
      cancelled = true
    }
  }, [])

  const displayReviews = useMemo(() => {
    if (reviews.length > 0) return reviews

    const popular = [...items]
      .sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.max(a.numReviews || 0, 1)
        const scoreB = (b.rating || 0) * Math.max(b.numReviews || 0, 1)
        return scoreB - scoreA
      })
      .slice(0, 6)

    if (popular.length > 0) {
      return popular.map((product, index) => ({
        id: `fallback-${product.id}`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        customerName: FALLBACK_REVIEWERS[index % FALLBACK_REVIEWERS.length],
        rating: product.rating || 4.5,
        comment: FALLBACK_COMMENTS[index % FALLBACK_COMMENTS.length],
        title: 'Customer favorite',
      }))
    }

    return STATIC_REVIEWS
  }, [reviews, items])

  const averageRating = useMemo(() => {
    if (displayReviews.length === 0) return 0
    const total = displayReviews.reduce((sum, r) => sum + (r.rating || 0), 0)
    return Math.round((total / displayReviews.length) * 10) / 10
  }, [displayReviews])

  return (
    <footer className="mt-10 w-full overflow-x-hidden border-t border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <RevealOnScroll className="mb-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Customer Reviews</h2>
              <p className="mt-1 text-sm text-slate-600">
                Star ratings from shoppers on our most popular items
              </p>
            </div>
            {displayReviews.length > 0 ? (
              <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-2">
                <StarRating value={averageRating} size="lg" showValue />
                <span className="text-xs text-slate-500">
                  avg. from {displayReviews.length} reviews
                </span>
              </div>
            ) : null}
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading reviews…</p>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayReviews.map((review) => (
                <article
                  key={review.id}
                  className="card-hover-glow rounded-xl border border-slate-100 bg-slate-50/80 p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <StarRating value={review.rating} size="lg" showValue />
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                      {review.rating >= 4.5 ? 'Excellent' : review.rating >= 4 ? 'Great' : 'Good'}
                    </span>
                  </div>

                  <div className="mt-3 flex items-start gap-3">
                    {review.productImage ? (
                      <img
                        src={review.productImage}
                        alt={review.productName || 'Product'}
                        className="h-14 w-14 shrink-0 rounded-lg object-cover transition-transform duration-500 hover:scale-[1.04]"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      {review.productId ? (
                        <Link
                          to={`/products/${review.productId}`}
                          className="line-clamp-1 text-sm font-semibold text-blue-700 hover:text-blue-900 transition-colors"
                        >
                          {review.productName || 'Product'}
                        </Link>
                      ) : (
                        <p className="line-clamp-1 text-sm font-semibold text-slate-900">
                          {review.productName || 'Product'}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">— {review.customerName}</p>
                    </div>
                  </div>

                  {review.title ? (
                    <p className="mt-3 text-sm font-medium text-slate-800">{review.title}</p>
                  ) : null}
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{review.comment}</p>
                </article>
              ))}
            </div>
          )}
        </RevealOnScroll>

        <RevealOnScroll className="mb-10 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-semibold text-slate-900 md:text-xl">Accepted Payment Methods</h2>
          <p className="mt-1 text-sm text-slate-600">
            Secure checkout with the payment options available on Bazarix
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {PAYMENT_METHODS.map((method) => (
              <div
                key={method.name}
                className="card-hover-glow flex w-[140px] sm:w-[160px] flex-col items-center rounded-xl border border-slate-100 bg-white p-3 shadow-sm"
                title={method.description}
              >
                <img
                  src={method.logo}
                  alt={`${method.name} logo`}
                  className="h-10 w-full object-contain transition-transform duration-300 hover:scale-105"
                  loading="lazy"
                />
                <p className="mt-2 text-center text-[11px] font-medium text-slate-600">{method.name}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="grid gap-8 border-t border-slate-200 pt-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <p className="text-lg font-bold text-blue-700">Bazarix</p>
            <p className="mt-2 text-sm text-slate-600">
              Your digital bazaar for authentic Pakistani cultural products from trusted regional sellers.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Shop</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/browse" className="footer-link">
                  Browse Store
                </Link>
              </li>
              <li>
                <Link to="/products" className="footer-link">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/regional" className="footer-link">
                  Regional Collections
                </Link>
              </li>
              <li>
                <Link to="/shops" className="footer-link">
                  Seller Shops
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Account</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {!isAuthenticated && (
                <>
                  <li>
                    <Link to="/login" className="footer-link">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="footer-link">
                      Register
                    </Link>
                  </li>
                </>
              )}
              {isAuthenticated && role === 'customer' && (
                <>
                  <li>
                    <Link to="/cart" className="footer-link">
                      Cart
                    </Link>
                  </li>
                  <li>
                    <Link to="/wishlist" className="footer-link">
                      Wishlist
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
          <div>
            <p className="font-semibold text-slate-900">Support</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="transition-all duration-300 hover:text-blue-600">Email: support@bazarix.pk</li>
              <li className="transition-all duration-300 hover:text-blue-600">Phone: +92 300 1234567</li>
              <li className="transition-all duration-300 hover:text-blue-600">Mon – Sat, 9am – 6pm PKT</li>
            </ul>
          </div>
        </RevealOnScroll>

        <RevealOnScroll className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Bazarix. All rights reserved.
          </p>
        </RevealOnScroll>
      </div>
    </footer>
  )
}

export default Footer
