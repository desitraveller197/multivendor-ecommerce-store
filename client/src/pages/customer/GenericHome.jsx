import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../../components/ProductCard'
import { addToCart } from '../../store/cartSlice'

function GenericHome() {
  const dispatch = useDispatch()
  const { items, categories } = useSelector((state) => state.products)

  const popular = useMemo(() => {
    return [...items]
      .sort((a, b) => {
        const scoreA = (a.rating || 0) * Math.max(a.numReviews || 0, 1)
        const scoreB = (b.rating || 0) * Math.max(b.numReviews || 0, 1)
        if (scoreB !== scoreA) return scoreB - scoreA
        return (b.rating || 0) - (a.rating || 0)
      })
      .slice(0, 8)
  }, [items])

  const topCategories = useMemo(() => {
    if (categories?.length) return categories.slice(0, 6)
    const unique = [...new Set(items.map((p) => p.category).filter(Boolean))]
    return unique.slice(0, 6)
  }, [categories, items])

  return (
    <section className="space-y-10">
      <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 md:p-12">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Welcome to Bazarix</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 md:text-4xl">
              Shop Pakistan&apos;s Best Cultural Products
            </h1>
            <p className="mt-3 text-sm text-slate-600 md:text-base">
              Discover handcrafted clothing, footwear, decor, and local specialties from trusted sellers
              across every region — all in one marketplace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
              >
                Shop All Products
              </Link>
              <Link
                to="/shops"
                className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
              >
                Browse Shops
              </Link>
            </div>
          </div>
          <div
            className="min-h-[220px] bg-cover bg-center md:min-h-[320px]"
            style={{ backgroundImage: "url('/images/punjab.png')" }}
            role="img"
            aria-label="Pakistani marketplace showcase"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Trusted Sellers', value: '100+', detail: 'Verified regional artisans' },
          { label: 'Products Listed', value: `${items.length || '500'}+`, detail: 'Handpicked cultural items' },
          { label: 'Customer Rating', value: '4.8★', detail: 'Loved by shoppers nationwide' },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-xl border border-slate-100 bg-white/90 p-5 text-center shadow-sm backdrop-blur-sm"
          >
            <p className="text-2xl font-bold text-blue-700">{stat.value}</p>
            <p className="mt-1 font-semibold text-slate-900">{stat.label}</p>
            <p className="mt-1 text-xs text-slate-500">{stat.detail}</p>
          </article>
        ))}
      </div>

      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Popular Products</h2>
            <p className="mt-1 text-sm text-slate-600">
              Top-rated items loved by our customers
            </p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-blue-700 hover:text-blue-900">
            View all →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.length > 0 ? (
            popular.map((product) => (
              <div key={product.id} className="flex flex-col">
                <ProductCard
                  product={product}
                  onAddToCart={(item) => dispatch(addToCart(item))}
                  linkToDetail
                />
              </div>
            ))
          ) : (
            <p className="col-span-full rounded-lg bg-white p-6 text-slate-600">
              Popular products will appear here once items are loaded.
            </p>
          )}
        </div>
      </div>

      {topCategories.length > 0 ? (
        <div>
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Shop by Category</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topCategories.map((category) => (
              <Link
                key={category}
                to={`/products?category=${encodeURIComponent(category)}`}
                className="rounded-xl border border-white/60 bg-white/90 px-5 py-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
              >
                <p className="font-semibold text-slate-900">{category}</p>
                <p className="mt-1 text-sm text-blue-700">Explore items →</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-8 text-white shadow-lg md:p-10">
        <h2 className="text-2xl font-bold">Ready to start shopping?</h2>
        <p className="mt-2 max-w-xl text-sm text-slate-200 md:text-base">
          Join thousands of customers discovering authentic Pakistani products from local sellers.
        </p>
        <Link
          to="/register"
          className="mt-5 inline-block rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg"
        >
          Create Free Account
        </Link>
      </div>
    </section>
  )
}

export default GenericHome
