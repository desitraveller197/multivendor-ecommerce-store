import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useSearchParams } from 'react-router-dom'
import PageFrame from '../../components/PageFrame'
import ProductCard from '../../components/ProductCard'
import { addToCart } from '../../store/cartSlice'

const PER_PAGE = 8
const PRICE_STEP = 500

const SIZE_FILTER_OPTIONS = ['XS', 'S', 'M', 'L', 'XL']
const COLOR_FILTER_OPTIONS = ['Black', 'White', 'Blue', 'Red', 'Green', 'Brown', 'Pink', 'Gold']
const SEASON_FILTER_OPTIONS = ['Winter', 'Summer', 'Spring', 'Autumn']

const SIZE_ALIASES = {
  'extra small': 'XS',
  xs: 'XS',
  small: 'S',
  s: 'S',
  large: 'L',
  l: 'L',
  'extra large': 'XL',
  xl: 'XL',
}

function normalizeSize(value) {
  const key = String(value || '').trim().toLowerCase()
  return SIZE_ALIASES[key] || null
}

function getProductSizes(product) {
  const sizes = new Set()
  for (const variant of product.variants || []) {
    const normalized = normalizeSize(variant.size)
    if (normalized) sizes.add(normalized)
  }
  return [...sizes]
}

function getProductColorFamilies(product) {
  return Array.isArray(product.colorFamilies) ? product.colorFamilies : []
}

function getProductSeasons(product) {
  return Array.isArray(product.seasons) ? product.seasons : []
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n))
}

function getEffectivePrice(product) {
  return product.discountPrice ?? product.price
}

function formatPkr(n) {
  return `PKR ${Math.round(n).toLocaleString('en-PK')}`
}

function CheckboxFilterGroup({ title, options, selected, onToggle }) {
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
            <span>{option}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

/** Number buttons with ellipses for large page counts (e.g. 1 … 4 5 6 … 12). */
function buildPaginationModel(current, total) {
  if (total <= 1) return []
  if (total <= 9) {
    return Array.from({ length: total }, (_, i) => ({ type: 'page', value: i + 1 }))
  }
  const pages = []
  const pushPage = (n) => pages.push({ type: 'page', value: n })
  const pushGap = () => {
    if (pages.length && pages[pages.length - 1].type !== 'ellipsis') {
      pages.push({ type: 'ellipsis' })
    }
  }

  pushPage(1)

  let left = Math.max(2, current - 1)
  let right = Math.min(total - 1, current + 1)
  if (current <= 4) {
    left = 2
    right = Math.min(6, total - 1)
  } else if (current >= total - 3) {
    left = Math.max(2, total - 5)
    right = total - 1
  }

  if (left > 2) pushGap()
  for (let i = left; i <= right; i += 1) pushPage(i)
  if (right < total - 1) pushGap()
  if (total > 1) pushPage(total)

  return pages
}

function useCatalogPriceExtent(items) {
  return useMemo(() => {
    if (!items.length) return { min: 0, max: 50_000 }
    let minV = Infinity
    let maxV = -Infinity
    for (const p of items) {
      const v = getEffectivePrice(p)
      if (Number.isFinite(v)) {
        minV = Math.min(minV, v)
        maxV = Math.max(maxV, v)
      }
    }
    if (!Number.isFinite(minV)) return { min: 0, max: 50_000 }
    const minR = Math.floor(minV / PRICE_STEP) * PRICE_STEP
    const maxR = Math.ceil(maxV / PRICE_STEP) * PRICE_STEP
    const minOut = Math.max(0, minR)
    const maxOut = Math.max(minOut + PRICE_STEP, maxR)
    return { min: minOut, max: maxOut }
  }, [items])
}

/** One control: shared track + two thumbs (min / max of the same range). */
function PriceRangeControl({
  extent,
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
  onReset,
}) {
  const span = Math.max(extent.max - extent.min, PRICE_STEP)
  const leftPct = ((minPrice - extent.min) / span) * 100
  const widthPct = Math.max(0, ((maxPrice - minPrice) / span) * 100)

  const minSliderMax = Math.max(extent.min, maxPrice - PRICE_STEP)
  const maxSliderMin = Math.min(extent.max, minPrice + PRICE_STEP)

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price range</h3>
          <p className="mt-0.5 text-xs text-slate-500">Uses sale price (discount when shown).</p>
        </div>
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          onClick={onReset}
        >
          Reset range
        </button>
      </div>

      <div className="dual-range mt-4 px-0.5">
        <div className="dual-range__track" aria-hidden />
        <div
          className="dual-range__fill"
          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
          aria-hidden
        />
        <input
          type="range"
          aria-label="Minimum price"
          min={extent.min}
          max={minSliderMax}
          step={PRICE_STEP}
          value={clamp(minPrice, extent.min, minSliderMax)}
          onChange={(e) => onMinChange(Number(e.target.value))}
        />
        <input
          type="range"
          aria-label="Maximum price"
          min={maxSliderMin}
          max={extent.max}
          step={PRICE_STEP}
          value={clamp(maxPrice, maxSliderMin, extent.max)}
          onChange={(e) => onMaxChange(Number(e.target.value))}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm font-medium text-slate-800">
        <span>{formatPkr(minPrice)}</span>
        <span className="text-slate-400">—</span>
        <span>{formatPkr(maxPrice)}</span>
      </div>
    </div>
  )
}

function ProductListing() {
  const dispatch = useDispatch()
  const { items, categories } = useSelector((state) => state.products)
  const [searchParams] = useSearchParams()
  const extent = useCatalogPriceExtent(items)
  const categoryOptions = useMemo(() => {
    const known = categories.filter(Boolean)
    const extra = [...new Set(items.map((item) => item.category).filter(Boolean))].filter(
      (item) => !known.includes(item),
    )
    return [...known, ...extra]
  }, [categories, items])

  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [minPrice, setMinPrice] = useState(extent.min)
  const [maxPrice, setMaxPrice] = useState(extent.max)
  const [selectedSizes, setSelectedSizes] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [selectedSeasons, setSelectedSeasons] = useState([])
  const [sortBy, setSortBy] = useState('default')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setMinPrice(extent.min)
    setMaxPrice(extent.max)
  }, [extent.min, extent.max])

  useEffect(() => {
    const initialCategory = searchParams.get('category')
    if (!initialCategory) return
    setCategory(initialCategory)
  }, [searchParams])

  const clampMin = (v) => {
    const hi = Math.max(extent.min, maxPrice - PRICE_STEP)
    return clamp(v, extent.min, hi)
  }
  const clampMax = (v) => {
    const lo = Math.min(extent.max, minPrice + PRICE_STEP)
    return clamp(v, lo, extent.max)
  }

  const toggleFromList = (value, setter) => {
    setter((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    )
    setPage(1)
  }

  const filteredSorted = useMemo(() => {
    const catIndex = (c) => {
      const i = categories.indexOf(c)
      return i === -1 ? 999 : i
    }
    const list = items.filter((product) => {
      const productSizes = getProductSizes(product)
      const productColors = getProductColorFamilies(product)
      const productSeasons = getProductSeasons(product)
      const matchQuery = `${product.name || ''} ${product.description || ''}`
        .toLowerCase()
        .includes(query.toLowerCase())
      const matchCategory = category === 'all' || (product.category || '') === category
      const price = getEffectivePrice(product)
      const matchPrice = price >= minPrice && price <= maxPrice
      const matchSize =
        selectedSizes.length === 0 || selectedSizes.some((size) => productSizes.includes(size))
      const matchColor =
        selectedColors.length === 0 || selectedColors.some((color) => productColors.includes(color))
      const matchSeason =
        selectedSeasons.length === 0 ||
        selectedSeasons.some((season) => productSeasons.includes(season))
      return matchQuery && matchCategory && matchPrice && matchSize && matchColor && matchSeason
    })

    list.sort((a, b) => {
      if (sortBy === 'price-asc') return getEffectivePrice(a) - getEffectivePrice(b)
      if (sortBy === 'price-desc') return getEffectivePrice(b) - getEffectivePrice(a)
      const ca = catIndex(a.category)
      const cb = catIndex(b.category)
      if (ca !== cb) return ca - cb
      return a.name.localeCompare(b.name)
    })
    return list
  }, [items, query, category, minPrice, maxPrice, selectedSizes, selectedColors, selectedSeasons, categories, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PER_PAGE))
  const pageClamped = Math.min(page, totalPages)
  const pageItems = filteredSorted.slice((pageClamped - 1) * PER_PAGE, pageClamped * PER_PAGE)
  const paginationModel = useMemo(() => buildPaginationModel(pageClamped, totalPages), [pageClamped, totalPages])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const resetPriceRange = () => {
    setMinPrice(extent.min)
    setMaxPrice(extent.max)
    setPage(1)
  }

  const clearAllFilters = () => {
    setQuery('')
    setCategory('all')
    setSelectedSizes([])
    setSelectedColors([])
    setSelectedSeasons([])
    setMinPrice(extent.min)
    setMaxPrice(extent.max)
    setPage(1)
  }

  const sortSelect = (
    <div className="flex w-full flex-col gap-1 sm:w-auto sm:items-end">
      <label htmlFor="product-sort" className="text-xs font-medium text-slate-200">
        Sort
      </label>
      <select
        id="product-sort"
        className="w-full min-w-[200px] rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-medium text-white shadow-sm outline-none backdrop-blur-sm focus:ring-2 focus:ring-white/40 sm:w-auto"
        value={sortBy}
        onChange={(e) => {
          setPage(1)
          setSortBy(e.target.value)
        }}
      >
        <option className="bg-slate-900 text-slate-100" value="default">
          Default (category, A–Z)
        </option>
        <option className="bg-slate-900 text-slate-100" value="price-asc">
          Price: Low to High
        </option>
        <option className="bg-slate-900 text-slate-100" value="price-desc">
          Price: High to Low
        </option>
      </select>
    </div>
  )

  return (
    <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 lg:px-6">
    <PageFrame
      title="All Products"
      description="Browse the full catalog. Use the filters on the left to narrow products by category, size, color family, season, and price."
      actions={sortSelect}
    >
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 self-start">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <div>
              <label htmlFor="product-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </label>
              <input
                id="product-search"
                type="text"
                placeholder="Search by product name..."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-2"
                value={query}
                onChange={(event) => {
                  setPage(1)
                  setQuery(event.target.value)
                }}
              />
            </div>

            <div className="mt-4">
              <label htmlFor="filter-category" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Category
              </label>
              <select
                id="filter-category"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm outline-none ring-blue-500/30 focus:border-blue-500 focus:ring-2"
                value={category}
                onChange={(event) => {
                  setPage(1)
                  setCategory(event.target.value)
                }}
              >
                <option value="all">All categories</option>
                {categoryOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <PriceRangeControl
                extent={extent}
                minPrice={minPrice}
                maxPrice={maxPrice}
                onMinChange={(v) => {
                  setPage(1)
                  setMinPrice(clampMin(v))
                }}
                onMaxChange={(v) => {
                  setPage(1)
                  setMaxPrice(clampMax(v))
                }}
                onReset={resetPriceRange}
              />
            </div>
          </div>

          <CheckboxFilterGroup
            title="Size"
            options={SIZE_FILTER_OPTIONS}
            selected={selectedSizes}
            onToggle={(value) => toggleFromList(value, setSelectedSizes)}
          />
          <CheckboxFilterGroup
            title="Color Family"
            options={COLOR_FILTER_OPTIONS}
            selected={selectedColors}
            onToggle={(value) => toggleFromList(value, setSelectedColors)}
          />
          <CheckboxFilterGroup
            title="Season"
            options={SEASON_FILTER_OPTIONS}
            selected={selectedSeasons}
            onToggle={(value) => toggleFromList(value, setSelectedSeasons)}
          />

          <button
            type="button"
            className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            onClick={clearAllFilters}
          >
            Clear all filters
          </button>
        </aside>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-6">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredSorted.length}</span> product
            {filteredSorted.length === 1 ? '' : 's'}
            {totalPages > 1 ? (
              <>
                {' '}
                · Page <span className="font-semibold text-slate-900">{pageClamped}</span> of{' '}
                <span className="font-semibold text-slate-900">{totalPages}</span>
              </>
            ) : null}
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((product) => (
              <div key={product.id} className="space-y-2">
                <ProductCard product={product} onAddToCart={(item) => dispatch(addToCart(item))} />
                <Link
                  to={`/products/${product.id}`}
                  className="block text-center text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  View details
                </Link>
              </div>
            ))}
          </div>

          {filteredSorted.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-500">No products match your filters.</p>
          ) : null}

          {totalPages > 1 ? (
            <nav
              className="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="Product list pagination"
            >
              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={pageClamped <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>

              <div className="flex flex-wrap items-center justify-center gap-1">
                {paginationModel.map((entry, idx) =>
                  entry.type === 'ellipsis' ? (
                    <span key={`e-${idx}`} className="px-2 text-slate-400">
                      …
                    </span>
                  ) : (
                    <button
                      key={entry.value}
                      type="button"
                      className={`min-w-[2.25rem] rounded-md border px-3 py-2 text-sm font-semibold shadow-sm transition-colors ${
                        entry.value === pageClamped
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                      onClick={() => setPage(entry.value)}
                      aria-current={entry.value === pageClamped ? 'page' : undefined}
                    >
                      {entry.value}
                    </button>
                  ),
                )}
              </div>

              <button
                type="button"
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={pageClamped >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          ) : null}
        </div>
      </div>
    </PageFrame>
    </div>
  )
}

export default ProductListing
