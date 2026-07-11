import { useEffect, useState } from 'react'
import axiosInstance from '../../api/axiosConfig'
import { USE_MOCK, delay } from '../../api/mockApi'
import Modal from '../../components/Modal'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'

function ManageSellers() {
  const [sellers, setSellers] = useState([])
  const [fetchState, setFetchState] = useState({ loading: true, error: '' })
  const [selectedSeller, setSelectedSeller] = useState(null)
  const [actionType, setActionType] = useState('approve')
  const [isActionLoading, setIsActionLoading] = useState(false)

  const fetchSellers = async () => {
    if (USE_MOCK) {
      await delay(600)
      return [
        { id: 1, name: 'Ali Raza', email: 'ali@shop.com', shop: 'Ali Electronics', status: 'pending' },
        { id: 2, name: 'Sara Khan', email: 'sara@shop.com', shop: 'Sara Crafts', status: 'pending' },
        { id: 3, name: 'Omar Tariq', email: 'omar@shop.com', shop: 'Omar Textiles', status: 'pending' },
      ]
    }

    const res = await axiosInstance.get('/admin/users?status=pending')
    return res.data
  }

  const approveSeller = async (id) => {
    if (USE_MOCK) {
      await delay(400)
      return { success: true }
    }

    await axiosInstance.put(`/admin/sellers/${id}/approve`)
    return { success: true }
  }

  const rejectSeller = async (id) => {
    if (USE_MOCK) {
      await delay(400)
      return { success: true }
    }

    await axiosInstance.put(`/admin/sellers/${id}/reject`)
    return { success: true }
  }

  useEffect(() => {
    let isMounted = true
    const run = async () => {
      setFetchState({ loading: true, error: '' })
      try {
        const data = await fetchSellers()
        if (!isMounted) return
        setSellers(Array.isArray(data) ? data : [])
        setFetchState({ loading: false, error: '' })
      } catch (err) {
        if (!isMounted) return
        setFetchState({
          loading: false,
          error: err?.response?.data?.message || err?.message || 'Failed to load sellers.',
        })
      }
    }
    run()
    return () => {
      isMounted = false
    }
  }, [])

  const openConfirm = (seller, action) => {
    setSelectedSeller(seller)
    setActionType(action)
  }

  const handleConfirm = async () => {
    if (!selectedSeller) return

    const sellerId = selectedSeller.id
    setIsActionLoading(true)

    try {
      if (actionType === 'approve') {
        await approveSeller(sellerId)
      } else {
        await rejectSeller(sellerId)
      }
      setSellers((prev) => prev.filter((item) => item.id !== sellerId))
      setSelectedSeller(null)
    } catch (err) {
      setFetchState((prev) => ({
        ...prev,
        error: err?.response?.data?.message || err?.message || 'Action failed. Please try again.',
      }))
      setSelectedSeller(null)
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <PageFrame title="Manage Sellers" description="Review and approve or reject seller applications.">
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="admin" />
        <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mt-1 space-y-3">
          {fetchState.loading ? (
            <>
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-14 animate-pulse rounded-lg bg-slate-100" />
            </>
          ) : fetchState.error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {fetchState.error}
            </div>
          ) : (
            sellers.map((seller) => (
              <div
                key={seller.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                    {seller.name}
                    {seller.isAppealed && (
                      <span className="inline-block rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 animate-pulse">
                        APPEALED
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{seller.email}</p>
                  {seller.shop && <p className="text-xs text-slate-400">{seller.shop}</p>}
                </div>
                <div className="flex gap-2">
                  <button
                    className="rounded-md bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-green-200 hover:shadow-sm"
                    onClick={() => openConfirm(seller, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-md bg-red-500 px-3 py-1.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-600 hover:shadow-sm"
                    onClick={() => openConfirm(seller, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        </div>
      </div>
      <Modal
        isOpen={Boolean(selectedSeller)}
        title="Confirm Seller Action"
        description={`Are you sure you want to ${actionType} this seller?`}
        onConfirm={handleConfirm}
        onClose={() => setSelectedSeller(null)}
        confirmText="Confirm"
        isConfirmLoading={isActionLoading}
      />
    </PageFrame>
  )
}

export default ManageSellers
