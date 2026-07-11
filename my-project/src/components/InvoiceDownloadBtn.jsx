import { useState } from 'react'
import axiosInstance from '../api/axiosConfig'
import { USE_MOCK, delay } from '../api/mockApi'

function InvoiceDownloadBtn({ orderId, orderNumber }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (!orderId) return
    setDownloading(true)
    try {
      if (USE_MOCK) {
        await delay(1000)
        const blob = new Blob([`Mock PDF Invoice for Order ${orderNumber || orderId}`], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Invoice-${orderNumber || orderId}.pdf`
        link.click()
        URL.revokeObjectURL(link.href)
      } else {
        const response = await axiosInstance.get(`/orders/${orderId}/invoice`, {
          responseType: 'blob',
        })
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `Invoice-${orderNumber || orderId}.pdf`
        link.click()
        URL.revokeObjectURL(link.href)
      }
    } catch (err) {
      console.error('Invoice download failed:', err)
      alert('Failed to download invoice. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition"
    >
      {downloading ? 'Downloading...' : 'Download Invoice'}
    </button>
  )
}

export default InvoiceDownloadBtn
