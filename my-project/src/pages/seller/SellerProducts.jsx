import { useSelector } from 'react-redux'
import Sidebar from '../../components/Sidebar'

function SellerProducts() {
  const products = useSelector((state) => state.products.items)

  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="seller" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Seller Products</h1>
        <div className="mt-4 space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between rounded-md border border-slate-200 p-3"
            >
              <span className="font-medium text-slate-800">{product.name}</span>
              <span className="text-slate-600">${product.price}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SellerProducts
