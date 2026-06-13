const demoOrders = [
  { id: 'ORD-1001', amount: 85, status: 'Delivered' },
  { id: 'ORD-1002', amount: 49, status: 'Processing' },
]

function Orders() {
  return (
    <section className="rounded-lg bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">Order History</h1>
      <div className="mt-4 space-y-3">
        {demoOrders.map((order) => (
          <div
            key={order.id}
            className="flex items-center justify-between rounded-md border border-slate-200 p-3"
          >
            <span className="font-medium text-slate-800">{order.id}</span>
            <span className="text-slate-600">${order.amount}</span>
            <span className="text-sm font-semibold text-blue-700">{order.status}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Orders
