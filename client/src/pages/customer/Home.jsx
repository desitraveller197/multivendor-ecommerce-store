import { Link } from 'react-router-dom'
import { useMemo, useEffect } from 'react'
import ProductCard from '../../components/ProductCard'
import HeroSlider from '../../components/HeroSlider'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../store/cartSlice'
import { fetchProducts } from '../../store/productSlice'
import RevealOnScroll from '../../components/RevealOnScroll'

function Home() {
  const dispatch = useDispatch()
  const { items, loading } = useSelector((state) => state.products)

  useEffect(() => {
    if (!items || items.length === 0) {
      dispatch(fetchProducts())
    }
  }, [dispatch, items])

  const featured = useMemo(() => {
    // Newest first, so any just-added product always surfaces in Featured.
    const newestFirst = [...items].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
    )
    const seenCategory = new Set()
    const picked = []
    // Lead with one product per category (newest of each) for variety.
    for (const p of newestFirst) {
      const cat = p.category || 'Other'
      if (!seenCategory.has(cat)) {
        seenCategory.add(cat)
        picked.push(p)
      }
    }
    // Fill any remaining slots with the next newest products.
    for (const p of newestFirst) {
      if (picked.length >= 8) break
      if (!picked.includes(p)) picked.push(p)
    }
    return picked.slice(0, 8)
  }, [items])
  const regionalCollections = [
    {
      name: 'Punjab Products',
      image: '/images/punjab.png',
      description: 'Textiles, khussa, and artisan-crafted goods from Punjab.',
      accent: 'from-amber-500/90 to-orange-500/80',
    },
    {
      name: 'Sindh Products',
      image: '/images/sindh.png',
      description: 'Ajrak-inspired styles, pottery, and authentic handcrafted pieces.',
      accent: 'from-rose-500/90 to-pink-600/80',
    },
    {
      name: 'KPK Products',
      image: '/images/kpk.png',
      description: 'Wool products, gemstones, and mountain region specialties.',
      accent: 'from-emerald-500/90 to-teal-600/80',
    },
    {
      name: 'Balochistan Products',
      image: '/images/balochistan.png',
      description: 'Embroidery, woven art, and locally sourced cultural products.',
      accent: 'from-violet-500/90 to-indigo-600/80',
    },
  ]
  const cultureCategories = [
    {
      title: 'Traditional Clothing',
      icon: '👘',
      description: 'Shalwar kameez, Ajrak kurtas, Balochi peshwas, and festive regional attire.',
    },
    {
      title: 'Electronics',
      icon: '📱',
      description: 'Gadgets, mobile accessories, smart devices, and tech essentials.',
    },
    {
      title: 'Footwear (Chappals)',
      icon: '👡',
      description: 'Peshawari chappals, Lahori khussa, Multani jutti, and Sindhi leather sandals.',
    },
    {
      title: 'Handicrafts & Decor',
      icon: '🏺',
      description: 'Hala pottery, Chinioti woodwork, mirror-work cushions, and copper karahi.',
    },
    {
      title: 'Organic Beauty',
      icon: '🌿',
      description: 'Multani Mitti, herbal henna, almond oil, and traditional kohl (surma).',
    },
    {
      title: 'Local Foods',
      icon: '🍯',
      description: 'Sargodha Sohan Halwa, Hunza dried apricots, Himalayan salt, and artisan achars.',
    },
  ]

  return (
    <section className="mx-auto max-w-[983px] space-y-10">
      <HeroSlider />

      <RevealOnScroll>
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Featured Products</h2>
        {loading && items.length === 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-[420px] rounded-lg bg-slate-100 animate-pulse p-4 flex flex-col justify-between">
                <div className="h-40 rounded bg-slate-200" />
                <div className="space-y-2 mt-4">
                  <div className="h-4 rounded bg-slate-200 w-3/4" />
                  <div className="h-3 rounded bg-slate-200 w-1/2" />
                </div>
                <div className="h-10 rounded bg-slate-200 mt-6" />
              </div>
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">No products available right now. Check back soon!</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={(item) => dispatch(addToCart(item))}
              />
            ))}
          </div>
        )}
      </RevealOnScroll>

      <RevealOnScroll className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
            Demographic Classification & Personalized Shopping UI
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Discover curated products by region and cultural preferences.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {regionalCollections.map((region) => (
            <article
              key={region.name}
              className="group relative overflow-hidden rounded-2xl shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div
                className="h-56 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${region.image})` }}
                role="img"
                aria-label={region.name}
              />
              <div className={`absolute inset-0 bg-gradient-to-t ${region.accent}`} />
              <div className="absolute inset-0 flex flex-col justify-end p-5 text-white">
                <h3 className="text-xl font-bold">{region.name}</h3>
                <p className="mt-1 text-sm text-white/90">{region.description}</p>
                <Link
                  to={`/regional?region=${encodeURIComponent(region.name.replace(' Products', ''))}`}
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-md bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 transition-all duration-300 hover:bg-white hover:shadow-lg"
                >
                  Explore Region
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </RevealOnScroll>

      <RevealOnScroll className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
          Culture-wise Shopping Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cultureCategories.map((category) => (
            <Link
              key={category.title}
              to={`/products?category=${encodeURIComponent(category.title)}`}
              className="group rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg block"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition-transform duration-300 group-hover:scale-110">
                <span role="img" aria-label={category.title}>
                  {category.icon}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{category.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{category.description}</p>
              <span
                className="mt-4 inline-block text-sm font-semibold text-blue-700 transition-colors duration-300 group-hover:text-blue-900"
              >
                Browse Category →
              </span>
            </Link>
          ))}
        </div>
      </RevealOnScroll>
    </section>
  )
}

export default Home
