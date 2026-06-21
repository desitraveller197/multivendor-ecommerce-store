import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import ConfirmModal from '../../components/ConfirmModal'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import { fetchProducts } from '../../store/productSlice'

function Products() {
  const dispatch = useDispatch()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        if (USE_MOCK) {
          await delay(600)
          setProducts([
            { id: 1, name: 'Embroidered Shalwar Kameez (Men)', category: 'Clothing', price: 5800, discountPrice: 4990, stock: 40 },
            { id: 7, name: 'Phulkari Dupatta', category: 'Shawls & Dupattas', price: 3200, discountPrice: 2890, stock: 22 },
            { id: 13, name: 'Peshawari Chappal (Charsi)', category: 'Footwear (Chappals)', price: 4800, discountPrice: 4290, stock: 35 },
            { id: 21, name: 'Gujranwala Copper Karahi', category: 'Handicrafts & Decor', price: 6900, discountPrice: 6290, stock: 14 },
          ])
        } else {
          const res = await axiosInstance.get('/products?mine=true')
          setProducts(res.data)
        }
      } catch (err) {
        console.error('Failed to fetch products:', err)
        setError('Failed to load products.')
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const handleDeleteClick = (product) => {
    setProductToDelete(product)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!productToDelete) return

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
    } catch (err) {
      console.error('Failed to delete product:', err)
      setError('Failed to delete product.')
      setDeleteModalOpen(false)
      setProductToDelete(null)
    }
  }

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="seller" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Products</h1>
          <Link to="/seller/products/add" className="rounded bg-blue-600 px-3 py-2 text-sm text-white">
            Add Product
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <>
              <div className="h-12 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-12 animate-pulse rounded border border-slate-200 bg-slate-100" />
              <div className="h-12 animate-pulse rounded border border-slate-200 bg-slate-100" />
            </>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="grid grid-cols-4 items-center gap-2 rounded border border-slate-200 p-3"
              >
                <span>{product.name}</span>
                <span>PKR {product.discountPrice || product.price}</span>
                <Link to={`/seller/products/edit/${product.id}`} className="text-sm text-blue-700">
                  Edit
                </Link>
                <button
                  className="rounded bg-red-500 px-2 py-1 text-sm text-white"
                  onClick={() => handleDeleteClick(product)}
                >
                  Delete
                </button>
              </div>
            ))
          )}
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
    </section>
  )
}

export default Products
