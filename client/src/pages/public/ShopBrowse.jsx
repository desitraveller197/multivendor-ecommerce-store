import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PageFrame from '../../components/PageFrame'
import axiosInstance from '../../api/axiosConfig'

function ShopBrowse() {
  const [query, setQuery] = useState('')
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await axiosInstance.get('/shops')
        setShops(res.data)
      } catch (err) {
        console.error('Failed to fetch shops:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchShops()
  }, [])

  const filteredShops = shops.filter((shop) =>
    shop.name.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="mx-auto max-w-[983px]">
    <PageFrame
      title="Browse Verified Shops"
      description="Find trusted sellers and explore their storefronts."
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search seller..."
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
            <div className="h-16 animate-pulse rounded-lg bg-slate-100" />
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map((shop) => (
              <Link
                key={shop.id || shop._id}
                to={`/shops/${shop.id || shop._id}`}
                className="block rounded-lg border border-slate-200 p-4 font-medium text-slate-800 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:text-blue-700 hover:shadow-sm"
              >
                {shop.name}
              </Link>
            ))}
            {filteredShops.length === 0 && (
              <p className="col-span-full py-4 text-center text-sm text-slate-500">
                No shops found matching "{query}".
              </p>
            )}
          </div>
        )}
      </div>
    </PageFrame>
    </div>
  )
}

export default ShopBrowse
