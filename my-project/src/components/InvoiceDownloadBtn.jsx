function InvoiceDownloadBtn({ orderId = 'INV-1001' }) {
  const handleDownload = () => {
    const blob = new Blob([`Invoice for ${orderId}`], { type: 'text/plain;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${orderId}.txt`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
    >
      Download Invoice
    </button>
  )
}

export default InvoiceDownloadBtn
