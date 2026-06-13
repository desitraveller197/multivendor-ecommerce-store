import DataTable from '../../components/DataTable'
import PageFrame from '../../components/PageFrame'

const columns = [
  { key: 'id', label: 'Transaction ID' },
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Amount' },
  { key: 'status', label: 'Status' },
]

const rows = [
  { id: 'TXN-1001', seller: 'UrbanCraft', amount: 'PKR 8,500', status: 'Completed' },
  { id: 'TXN-1002', seller: 'TechHive', amount: 'PKR 12,000', status: 'Pending' },
]

function Transactions() {
  return (
    <PageFrame title="Transactions" description="Monitor all payment and settlement transactions.">
      <DataTable columns={columns} rows={rows} />
    </PageFrame>
  )
}

export default Transactions
