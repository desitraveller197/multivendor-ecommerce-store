import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../../components/ProductCard'
import { addToCart } from '../../store/cartSlice'

const REGION_META = {
  Punjab: {
    image: '/images/punjab.png',
    description: 'Textiles, khussa, and artisan-crafted goods from Punjab.',
  },
  Sindh: {
    image: '/images/sindh.png',
    description: 'Ajrak-inspired styles, pottery, and handcrafted products from Sindh.',
  },
  KPK: {
    image: '/images/kpk.png',
    description: 'Wool products, gemstones, and mountain specialties from KPK.',
  },
  Balochistan: {
    image: '/images/balochistan.png',
    description: 'Embroidery, woven art, and local cultural crafts from Balochistan.',
  },
}

const REGION_OPTIONS = Object.keys(REGION_META)
const CATEGORY_CULTURE_MAP = {
  'Clothing': 'Traditional Clothing',
  'Shawls & Dupattas': 'Traditional Clothing',
  'Footwear (Chappals)': 'Cultural Accessories',
  'Handicrafts & Decor': 'Cultural Decor',
  'Organic Beauty': 'Wellness & Beauty',
  'Local Foods': 'Local Foods',
}

/** Home / URL culture filters may use labels that map to product categories or stored culture. */
function cultureFilterMatches(item, selectedCultures, effectiveCulture) {
  if (selectedCultures.length === 0) return true
  // "General" is a catch-all — selecting it shows products from every region/culture.
  if (selectedCultures.includes('General')) return true
  return selectedCultures.some((sel) => {
    if (sel === effectiveCulture) return true
    if (sel === 'Cultural Accessories' && item.category === 'Footwear (Chappals)') return true
    if (sel === 'Cultural Decor' && item.category === 'Handicrafts & Decor') return true
    if (sel === 'Traditional Clothing' && (item.category === 'Clothing' || item.category === 'Shawls & Dupattas')) return true
    if (sel === 'Wellness & Beauty' && item.category === 'Organic Beauty') return true
    if (sel === 'Local Foods' && item.category === 'Local Foods') return true
    return false
  })
}

const REGION_IMAGE_KEYWORDS = {
  Punjab: ['punjab', 'lahore', 'textile', 'craft'],
  Sindh: ['sindh', 'ajrak', 'handicraft', 'pottery'],
  KPK: ['kpk', 'swat', 'wool', 'mountains', 'handmade'],
  Balochistan: ['balochistan', 'embroidery', 'woven', 'craft'],
}

const CULTURE_IMAGE_KEYWORDS = {
  'Traditional Clothing': ['pakistani', 'traditional', 'clothing', 'kurta', 'shalwar'],
  Handicrafts: ['handicraft', 'artisan', 'handmade'],
  'Cultural Accessories': ['chappal', 'khussa', 'footwear', 'leather', 'sandal'],
  'Cultural Decor': ['home', 'decor', 'handmade', 'pottery', 'ceramic'],
  'Wellness & Beauty': ['skincare', 'beauty', 'henna', 'mehendi', 'herbal'],
  'Local Foods': ['food', 'sweets', 'spices', 'dried-fruits', 'traditional'],
  General: ['product', 'pakistan', 'bazaar'],
}

function buildUnsplashSourceUrl(keywords) {
  const query = keywords.filter(Boolean).join(',')
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(query)}`
}

function getContextualProductImage({ region, culture, name }) {
  const regionKeywords = region ? REGION_IMAGE_KEYWORDS[region] ?? [] : []
  const cultureKeywords = CULTURE_IMAGE_KEYWORDS[culture] ?? CULTURE_IMAGE_KEYWORDS.General
  return buildUnsplashSourceUrl([...regionKeywords, ...cultureKeywords, name].slice(0, 7))
}

function enrichProducts(items) {
  return items.map((item) => {
    const culture = item.culture ?? CATEGORY_CULTURE_MAP[item.category] ?? 'General'
    const image = item.image || getContextualProductImage({
      region: item.region,
      culture,
      name: item.name,
    })
    return { ...item, culture, image }
  })
}

function MultiSelectFilter({ title, options, selected, onToggle }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-3 space-y-2">
        {options.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}

function Regional() {
  const dispatch = useDispatch()
  const [searchParams] = useSearchParams()
  const products = useSelector((state) => state.products.items)
  const categoryOrder = useSelector((state) => state.products.categories)
  const [selectedRegions, setSelectedRegions] = useState([])
  const [selectedCultures, setSelectedCultures] = useState([])
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  const enrichedProducts = useMemo(
    () => enrichProducts(products),
    [products],
  )

  const cultureOptions = useMemo(
    () => [...new Set(enrichedProducts.map((item) => item.culture))].sort(),
    [enrichedProducts],
  )

  useEffect(() => {
    const regionQuery = searchParams.get('region')
    const cultureQuery = searchParams.get('culture')

    setSelectedRegions(regionQuery ? [regionQuery] : [])
    setSelectedCultures(cultureQuery ? [cultureQuery] : [])
  }, [searchParams])

  const toggleFilter = (value, setter) => {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
  }

  const isFilterActive = selectedRegions.length > 0 || selectedCultures.length > 0

  const filteredProducts = useMemo(() => {
    if (!isFilterActive) return enrichedProducts
    return enrichedProducts.filter((item) => {
      const regionMatch =
        selectedRegions.length === 0 ||
        (item.region != null && selectedRegions.includes(item.region))
      const cultureMatch = cultureFilterMatches(item, selectedCultures, item.culture)
      return regionMatch && cultureMatch
    })
  }, [enrichedProducts, selectedRegions, selectedCultures, isFilterActive])

  const productsByCategory = useMemo(() => {
    const buckets = new Map()
    for (const cat of categoryOrder) buckets.set(cat, [])
    for (const p of filteredProducts) {
      const key = p.category || 'Other'
      if (!buckets.has(key)) buckets.set(key, [])
      buckets.get(key).push(p)
    }
    const extra = [...buckets.keys()].filter((k) => !categoryOrder.includes(k)).sort()
    const orderedKeys = [...categoryOrder.filter((c) => (buckets.get(c) ?? []).length > 0), ...extra]
    return orderedKeys.map((name) => ({ name, products: buckets.get(name) }))
  }, [filteredProducts, categoryOrder])

  const activeRegion = selectedRegions.length === 1 ? selectedRegions[0] : null
  const bannerImage = activeRegion
    ? REGION_META[activeRegion]?.image
    : '/images/regional-collections.png'
  const bannerTitle = activeRegion ? `${activeRegion} Regional Collection` : 'Regional Collections'
  const bannerDescription = activeRegion
    ? REGION_META[activeRegion]?.description
    : 'Explore products based on regional identity and cultural preferences.'

  const filtersPanel = (
    <div className="space-y-4">
      <MultiSelectFilter
        title="Region"
        options={REGION_OPTIONS}
        selected={selectedRegions}
        onToggle={(value) => toggleFilter(value, setSelectedRegions)}
      />
      <MultiSelectFilter
        title="Culture"
        options={cultureOptions}
        selected={selectedCultures}
        onToggle={(value) => toggleFilter(value, setSelectedCultures)}
      />
      <button
        className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => {
          setSelectedRegions([])
          setSelectedCultures([])
        }}
      >
        Clear filters
      </button>
    </div>
  )

  return (
    <section className="space-y-6">
      <div className="relative h-56 overflow-hidden rounded-2xl shadow-md md:h-72">
        <img
          src={bannerImage}
          alt={bannerTitle}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white md:p-8">
          <h1 className="text-2xl font-bold md:text-3xl">{bannerTitle}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-100 md:text-base">{bannerDescription}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
        </p>
        <button
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 md:hidden"
          onClick={() => setMobileFiltersOpen(true)}
        >
          Smart Filters
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px,1fr]">
        <aside className="hidden md:block">{filtersPanel}</aside>
        <div className="space-y-10">
          {!isFilterActive ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center text-slate-500">
              <p className="text-base font-semibold text-slate-700">Please select a region or culture to view products.</p>
              <p className="mt-1 text-sm text-slate-400">Use the filters on the left to explore regional Pakistani crafts, apparel, and foods.</p>
            </div>
          ) : productsByCategory.length === 0 ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No products match the selected filters. Try clearing filters or exploring another region or culture.
            </p>
          ) : (
            productsByCategory.map(({ name, products: sectionProducts }) => (
              <div key={name}>
                <h2 className="text-xl font-semibold text-slate-900">{name}</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {sectionProducts.map((product) => (
                    <div key={`grid-${product.id}`} className="space-y-2">
                      <ProductCard product={product} onAddToCart={(item) => dispatch(addToCart(item))} />
                      <Link
                        to={`/products/${product.id}`}
                        className="block text-center text-sm font-semibold text-blue-700"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 md:hidden">
          <div className="ml-auto h-full w-full max-w-sm overflow-y-auto rounded-xl bg-white p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Smart Filters</h2>
              <button
                className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-700"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Close
              </button>
            </div>
            {filtersPanel}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default Regional
