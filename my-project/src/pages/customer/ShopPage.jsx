import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { addToCart } from '../../store/cartSlice'
import ProductCard from '../../components/ProductCard'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'

function ShopPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  
  const [shop, setShop] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('All')

  const shopCategories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category))].filter(Boolean).sort()
    return ['All', ...cats]
  }, [products])

  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products
    return products.filter((p) => p.category === selectedCategory)
  }, [products, selectedCategory])
  
  const [shopLoading, setShopLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setShop({
            name: 'Punjab Handloom',
            description: 'Authentic Punjabi textiles, phulkari embroidery, and traditional crafts from the heart of Punjab.',
            logo: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=200',
            banner: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200',
            rating: 4.7,
            totalSales: 312,
            joinedDate: '2024-01-10',
          })
        } else {
          const res = await axiosInstance.get(`/shops/${id}`)
          setShop(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch shop details:', err)
        setError('Failed to load shop details.')
      } finally {
        setShopLoading(false)
      }
    }
    
    fetchShopInfo()
  }, [id])

  useEffect(() => {
    const fetchShopProducts = async () => {
      try {
        if (USE_MOCK) {
          await delay(700)
          setProducts([
            { id: 1, name: 'Phulkari Dupatta', category: 'Shawls & Dupattas',
              price: 3200, discountPrice: 2890, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=900', seller: 'Punjab Handloom', rating: 4.7 },
            { id: 6, name: 'Kids Embroidered Kurta Set', category: 'Clothing',
              price: 3200, discountPrice: 2790, image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=900', seller: 'Punjab Handloom', rating: 4.5 },
            { id: 20, name: 'Punjabi Mirror-Work Cushion', category: 'Handicrafts & Decor',
              price: 2600, discountPrice: 2290, image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=900', seller: 'Punjab Handloom', rating: 4.6 },
          ])
        } else {
          const res = await axiosInstance.get(`/shops/${id}/products?limit=500`)
          setProducts(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch shop products:', err)
      } finally {
        setProductsLoading(false)
      }
    }
    
    fetchShopProducts()
  }, [id])

  const handleAddToCart = (product) => {
    dispatch(addToCart({ ...product, quantity: 1 }))
  }

  if (error) {
    return (
      <section className="rounded-lg bg-white p-6 shadow-sm">
        <div className="rounded bg-red-50 p-3 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-lg bg-white shadow-sm overflow-hidden pb-6">
      {shopLoading ? (
        <div className="animate-pulse">
          <div className="h-44 w-full bg-slate-200 rounded-t-lg"></div>
          <div className="flex items-end gap-4 px-4 relative -mt-8">
            <div className="h-16 w-16 rounded-full border-4 border-white bg-slate-300 shadow"></div>
            <div className="space-y-2 pb-1 bg-white px-2 rounded backdrop-blur-sm bg-opacity-80 pt-2 -ml-2">
              <div className="h-6 w-48 bg-slate-200 rounded"></div>
              <div className="h-4 w-64 bg-slate-200 rounded"></div>
              <div className="h-4 w-40 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      ) : shop ? (
        <>
          <div className="h-44 w-full overflow-hidden bg-slate-200">
            {shop.banner && <img src={shop.banner} alt={`${shop.name} banner`} className="h-full w-full object-cover" />}
          </div>
          <div className="flex items-end gap-4 px-4 relative -mt-8">
            {shop.logo ? (
              <img src={shop.logo} alt={`${shop.name} logo`} className="h-16 w-16 rounded-full border-4 border-white object-cover shadow bg-white" />
            ) : (
              <div className="h-16 w-16 rounded-full border-4 border-white bg-slate-100 shadow"></div>
            )}
            <div className="bg-white/90 backdrop-blur pb-1 pt-4 px-2 -mb-2 rounded -ml-2 z-10">
              <h1 className="text-xl font-bold text-slate-900">{shop.name}</h1>
              <p className="text-sm text-slate-600">{shop.description}</p>
              <p className="text-sm text-slate-500">
                ★ {shop.rating} · {shop.totalSales} sales · 
                Joined {new Date(shop.joinedDate).toLocaleDateString('en-PK', { year:'numeric', month:'long' })}
              </p>
            </div>
          </div>
        </>
      ) : null}

      <div className="px-6">
        <hr className="my-8 border-slate-200" />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-800">Products ({filteredProducts.length})</h2>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {shopCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        
        <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productsLoading ? (
            <>
              <div className="h-64 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-64 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-64 animate-pulse rounded border border-slate-200 bg-slate-100" />
            </>
          ) : (
            filteredProducts.map((p) => (
              <div key={p.id} className="space-y-2">
                <ProductCard product={p} onAddToCart={() => handleAddToCart(p)} />
                <Link
                  to={`/products/${p.id}`}
                  className="block text-center text-sm font-semibold text-blue-700 hover:text-blue-900"
                >
                  View Details
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  )
}

export default ShopPage
