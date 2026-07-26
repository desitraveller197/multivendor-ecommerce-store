import Sidebar from '../../components/Sidebar'

const demoSellers = [
  { id: 1, name: 'Ayan Traders', status: 'Active' },
  { id: 2, name: 'Digital Mart', status: 'Pending Verification' },
  { id: 3, name: 'Smart Hub', status: 'Active' },
]

function SellersManagement() {
  return (
    <section className="grid gap-4 md:grid-cols-[240px_1fr]">
      <Sidebar role="admin" />
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Sellers Management</h1>
        <div className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200">
          {demoSellers.map((seller) => (
            <div key={seller.id} className="flex items-center justify-between p-3 text-sm">
              <span className="font-medium text-slate-800">{seller.name}</span>
              <span className="text-slate-600">{seller.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SellersManagement
