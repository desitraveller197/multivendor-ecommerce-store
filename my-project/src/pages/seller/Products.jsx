import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import ConfirmModal from '../../components/ConfirmModal'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { fetchProducts, updateProduct as updateProductRedux } from '../../store/productSlice'

function Products() {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Tabs: 'catalog' | 'stock'
  const [activeTab, setActiveTab] = useState('catalog')
  
  // Stock filters: 'all' | 'outOfStock' | 'lowStock'
  const [stockFilter, setStockFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  // State to hold temporary stock edits
  const [editableStock, setEditableStock] = useState({}) // { productId: value }
  const [savingStockId, setSavingStockId] = useState(null)

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  const fetchProductsData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (USE_MOCK) {
        await delay(600)
        const mockData = [
          { id: 1, name: 'Embroidered Shalwar Kameez (Men)', category: 'Clothing', price: 5800, discountPrice: 4990, stock: 40 },
          { id: 7, name: 'Phulkari Dupatta', category: 'Shawls & Dupattas', price: 3200, discountPrice: 2890, stock: 22 },
          { id: 13, name: 'Peshawari Chappal (Charsi)', category: 'Footwear (Chappals)', price: 4800, discountPrice: 4290, stock: 0 },
          { id: 21, name: 'Gujranwala Copper Karahi', category: 'Handicrafts & Decor', price: 6900, discountPrice: 6290, stock: 3 },
        ]
        setProducts(mockData)
        // Initialize editable stock values
        const stocks = {}
        mockData.forEach(p => { stocks[p.id] = p.stock })
        setEditableStock(stocks)
      } else {
        const res = await axiosInstance.get('/products?mine=true')
        setProducts(res.data)
        // Initialize editable stock values
        const stocks = {}
        res.data.forEach(p => { stocks[p.id] = p.stock })
        setEditableStock(stocks)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
      setError('Failed to load products.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductsData()
  }, [])

  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return
    setError(null)
    try {
      if (USE_MOCK) {
        await delay(400)
      } else {
        await axiosInstance.delete(`/products/${productToDelete.id}`)
        dispatch(fetchProducts())
      }
      setProducts(products.filter((p) => p.id !== productToDelete.id))
      setDeleteModalOpen(false)
      setProductToDelete(null)
      setSuccess('Product deleted successfully.')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to delete product:', err)
      setError('Failed to delete product.')
      setDeleteModalOpen(false)
      setProductToDelete(null)
    }
  }

  const handleStockChange = (productId, val) => {
    const parsed = Math.max(0, parseInt(val, 10) || 0)
    setEditableStock(prev => ({ ...prev, [productId]: parsed }))
  }

  const adjustStock = (productId, amount) => {
    const currentVal = editableStock[productId] !== undefined ? editableStock[productId] : 0
    const nextVal = Math.max(0, currentVal + amount)
    setEditableStock(prev => ({ ...prev, [productId]: nextVal }))
  }

  const handleUpdateStock = async (product) => {
    const newStock = editableStock[product.id]
    if (newStock === undefined || newStock === product.stock) return
    
    setSavingStockId(product.id)
    setError(null)
    setSuccess(null)
    try {
      if (USE_MOCK) {
        await delay(500)
        dispatch(updateProductRedux({ id: product.id, stock: newStock }))
      } else {
        await axiosInstance.put(`/products/${product.id}`, { ...product, stock: newStock })
        dispatch(fetchProducts())
      }
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, stock: newStock } : p))
      setSuccess(`Stock updated successfully for "${product.name}".`)
      setTimeout(() => setSuccess(null), 3500)
    } catch (err) {
      console.error('Failed to update stock:', err)
      setError(`Failed to update stock for "${product.name}".`)
    } finally {
      setSavingStockId(null)
    }
  }

  // Count stats
  const totalOutOfStock = products.filter(p => p.stock === 0).length
  const totalLowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length

  // Filter & Search logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false

    if (activeTab === 'stock') {
      if (stockFilter === 'outOfStock') return p.stock === 0
      if (stockFilter === 'lowStock') return p.stock > 0 && p.stock <= 5
    }
    return true
  })

  return (
    <PageFrame title="My Products" description="Manage your catalog — add, edit, remove or restock products.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
          
          {/* Header Action */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab('catalog')}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all ${
                  activeTab === 'catalog'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Catalog Listing
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`pb-2 text-sm font-semibold border-b-2 transition-all relative ${
                  activeTab === 'stock'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                Stock Manager
                {totalOutOfStock > 0 && (
                  <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                    {totalOutOfStock}
                  </span>
                )}
              </button>
            </div>
            <Link
              to="/seller/products/add"
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              + Add Product
            </Link>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Search bar & status filter chips */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by name..."
                className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-4 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {activeTab === 'stock' && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStockFilter('all')}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    stockFilter === 'all'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({products.length})
                </button>
                <button
                  onClick={() => setStockFilter('outOfStock')}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    stockFilter === 'outOfStock'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Out of Stock ({totalOutOfStock})
                </button>
                <button
                  onClick={() => setStockFilter('lowStock')}
                  className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                    stockFilter === 'lowStock'
                      ? 'bg-amber-500 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Low Stock ({totalLowStock})
                </button>
              </div>
            )}
          </div>

          {/* List display */}
          <div className="mt-4 space-y-3">
            {loading ? (
              <>
                <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
                <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
                <div className="h-16 animate-pulse rounded-lg border border-slate-200 bg-slate-50" />
              </>
            ) : filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <p className="text-sm font-medium">No products found matching your filters.</p>
              </div>
            ) : activeTab === 'catalog' ? (
              // CATALOG LIST VIEW
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-900">{product.name}</p>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-sm font-bold text-blue-700">PKR {product.discountPrice || product.price}</p>
                      <span className="text-xs text-slate-400">|</span>
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">
                          🔴 Out of Stock
                        </span>
                      ) : product.stock <= 5 ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          ⚠️ Low Stock ({product.stock} left)
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                          🟢 In Stock ({product.stock})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/seller/products/edit/${product.id}`}
                      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm"
                    >
                      Edit
                    </Link>
                    <button
                      className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-sm"
                      onClick={() => handleDeleteClick(product)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              // STOCK MANAGER TAB VIEW
              filteredProducts.map((product) => {
                const draftVal = editableStock[product.id] !== undefined ? editableStock[product.id] : product.stock
                const isModified = draftVal !== product.stock
                const isSaving = savingStockId === product.id

                return (
                  <div
                    key={product.id}
                    className={`flex flex-col gap-4 rounded-lg border p-4 transition-all duration-200 md:flex-row md:items-center md:justify-between ${
                      product.stock === 0
                        ? 'border-red-200 bg-red-50/20'
                        : product.stock <= 5
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Product general info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{product.name}</p>
                      <div className="mt-1 flex items-center gap-2 flex-wrap">
                        {product.stock === 0 ? (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                            🔴 Out of Stock
                          </span>
                        ) : product.stock <= 5 ? (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                            ⚠️ Low Stock ({product.stock} left)
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                            🟢 In Stock ({product.stock})
                          </span>
                        )}
                        <span className="text-xs text-slate-400">Category: {product.category}</span>
                      </div>
                    </div>

                    {/* Stock controller section */}
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Plus/minus buttons */}
                      <div className="flex items-center rounded-lg border border-slate-300 bg-white p-1">
                        <button
                          type="button"
                          onClick={() => adjustStock(product.id, -1)}
                          disabled={draftVal <= 0}
                          className="flex h-8 w-8 items-center justify-center rounded-md font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-40 transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={draftVal}
                          onChange={(e) => handleStockChange(product.id, e.target.value)}
                          className="w-12 text-center text-sm font-bold text-slate-800 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => adjustStock(product.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-md font-bold text-slate-500 hover:bg-slate-100 transition"
                        >
                          +
                        </button>
                      </div>

                      {/* Quick adding buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => adjustStock(product.id, 5)}
                          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => adjustStock(product.id, 20)}
                          className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                        >
                          +20
                        </button>
                      </div>

                      {/* Update action button */}
                      <button
                        type="button"
                        disabled={!isModified || isSaving}
                        onClick={() => handleUpdateStock(product)}
                        className={`rounded-md px-4 py-1.5 text-sm font-bold shadow-sm transition-all duration-200 ${
                          isModified
                            ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isSaving ? 'Saving…' : 'Update'}
                      </button>

                      {/* Reset to original value button */}
                      {isModified && (
                        <button
                          type="button"
                          onClick={() => handleStockChange(product.id, product.stock)}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-700 underline transition"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Delete Product"
        message={`Are you sure you want to delete ${productToDelete?.name}?`}
        onCancel={() => {
          setDeleteModalOpen(false)
          setProductToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </PageFrame>
  )
}

export default Products
