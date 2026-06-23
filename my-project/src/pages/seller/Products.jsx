import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
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
    const fetchProductsData = async () => {
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
    fetchProductsData()
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
    <PageFrame title="My Products" description="Manage your catalog — add, edit, or remove the products in your shop.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Products</h2>
          <Link
            to="/seller/products/add"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
          >
            + Add Product
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 space-y-2">
          {loading ? (
            <>
              <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
            </>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">{product.name}</p>
                  <p className="text-sm font-bold text-blue-700">PKR {product.discountPrice || product.price}</p>
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
      </div>
    </PageFrame>
  )
}

export default Products
