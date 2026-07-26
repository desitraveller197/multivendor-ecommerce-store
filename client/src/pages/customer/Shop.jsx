import { useDispatch, useSelector } from 'react-redux'
import ProductCard from '../../components/ProductCard'
import { addToCart } from '../../store/cartSlice'

function Shop() {
  const dispatch = useDispatch()
  const products = useSelector((state) => state.products.items)

  return (
    <section>
      <h1 className="text-2xl font-bold text-slate-900">Shop Products</h1>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={(item) => dispatch(addToCart(item))}
          />
        ))}
      </div>
    </section>
  )
}

export default Shop
