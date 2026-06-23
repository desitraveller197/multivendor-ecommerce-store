import PageFrame from '../../components/PageFrame'

function WithdrawEarnings() {
  return (
    <PageFrame
      title="Withdraw Earnings"
      description="Request payouts and keep your revenue flowing on schedule."
    >
      <div className="grid gap-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Available Balance</p>
          <p className="mt-1 text-3xl font-bold text-blue-700">PKR 124,000</p>
        </div>
        <form className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Withdrawal Amount</label>
            <input
              type="number"
              placeholder="Enter amount"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Payout Method</label>
            <select className="w-full rounded border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
              <option>Bank Transfer</option>
              <option>JazzCash</option>
              <option>EasyPaisa</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Request Withdrawal
          </button>
        </form>
      </div>
    </PageFrame>
  )
}

export default WithdrawEarnings
