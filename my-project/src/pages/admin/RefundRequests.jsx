import DataTable from '../../components/DataTable'
import PageFrame from '../../components/PageFrame'

const columns = [
  { key: 'orderId', label: 'Order ID' },
  { key: 'customer', label: 'Customer' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
]

const rows = [
  { orderId: '#10021', customer: 'Ali Khan', reason: 'Damaged item', status: 'Pending' },
  { orderId: '#10052', customer: 'Sara Noor', reason: 'Wrong variant', status: 'Approved' },
]

function RefundRequests() {
  return (
    <PageFrame title="Refund Requests" description="Handle return and refund workflows centrally.">
      <DataTable columns={columns} rows={rows} />
    </PageFrame>
  )
}

export default RefundRequests
