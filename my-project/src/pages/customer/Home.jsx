import { Link } from 'react-router-dom'
import { useMemo } from 'react'
import ProductCard from '../../components/ProductCard'
import { useDispatch, useSelector } from 'react-redux'
import { addToCart } from '../../store/cartSlice'

function Home() {
  const dispatch = useDispatch()
  const { items } = useSelector((state) => state.products)

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
      title: 'Shawls & Dupattas',
      icon: '🧣',
      description: 'Phulkari dupattas, Swati woolen shawls, Ajrak wraps, and Pashmina from GB.',
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
      <div className="rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-600 p-8 text-white shadow-lg transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl md:p-10">
        <h1 className="text-3xl font-bold md:text-4xl">Bazarix</h1>
        <p className="mt-2 max-w-2xl text-sm text-blue-100 md:text-base">
          "Your digital bazaar, reimagined."
        </p>
        <Link
          to="/products"
          className="mt-5 inline-block rounded-md bg-white px-5 py-2 text-sm font-semibold text-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-lg"
        >
          Explore Products
        </Link>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">Featured Products</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(item) => dispatch(addToCart(item))}
            />
          ))}
        </div>
      </div>

      <div className="space-y-4">
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
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900 md:text-2xl">
          Culture-wise Shopping Categories
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cultureCategories.map((category) => (
            <article
              key={category.title}
              className="group rounded-2xl border border-white/60 bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-2xl transition-transform duration-300 group-hover:scale-110">
                <span role="img" aria-label={category.title}>
                  {category.icon}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{category.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{category.description}</p>
              <Link
                to={`/regional?culture=${encodeURIComponent(category.title)}`}
                className="mt-4 inline-block text-sm font-semibold text-blue-700 transition-colors duration-300 group-hover:text-blue-900"
              >
                Browse Category
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Home
