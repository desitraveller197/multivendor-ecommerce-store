import DataTable from '../../components/DataTable'
import PageFrame from '../../components/PageFrame'

const columns = [
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Requested Amount' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status' },
]

const rows = [
  { seller: 'StyleNest', amount: 'PKR 30,000', method: 'Bank', status: 'Reviewing' },
  { seller: 'GadgetHub', amount: 'PKR 18,500', method: 'JazzCash', status: 'Pending' },
]

function WithdrawalRequests() {
  return (
    <PageFrame
      title="Withdrawal Requests"
      description="Review and approve seller payout requests with confidence."
    >
      <DataTable columns={columns} rows={rows} />
    </PageFrame>
  )
}

export default WithdrawalRequests
