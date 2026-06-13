import PageFrame from '../../components/PageFrame'

function WithdrawEarnings() {
  return (
    <PageFrame
      title="Withdraw Earnings"
      description="Request payouts and keep your revenue flowing on schedule."
    >
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div>
          <p className="text-sm text-slate-500">Available Balance</p>
          <p className="text-3xl font-bold text-emerald-600">PKR 124,000</p>
        </div>
        <form className="space-y-3">
          <input
            type="number"
            placeholder="Withdrawal amount"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <select className="w-full rounded-md border border-slate-300 px-3 py-2">
            <option>Bank Transfer</option>
            <option>JazzCash</option>
            <option>EasyPaisa</option>
          </select>
          <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
            Request Withdrawal
          </button>
        </form>
      </div>
    </PageFrame>
  )
}

export default WithdrawEarnings
