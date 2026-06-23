import { useState } from 'react'
import CommissionInput from '../../components/CommissionInput'
import PageFrame from '../../components/PageFrame'

function PlatformSettings() {
  const [commission, setCommission] = useState(10)

  return (
    <PageFrame
      title="Platform Settings"
      description="Configure key marketplace controls and monetization rules."
    >
      <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-medium text-slate-700">Default Seller Commission</label>
        <CommissionInput value={commission} onChange={setCommission} />
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" className="h-4 w-4" defaultChecked />
          Enable automatic refund approval under PKR 1,000
        </label>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Save Settings
        </button>
      </div>
    </PageFrame>
  )
}

export default PlatformSettings
