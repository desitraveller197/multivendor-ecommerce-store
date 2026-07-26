import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import * as XLSX from 'xlsx'
import Sidebar from '../../components/Sidebar'
import PageFrame from '../../components/PageFrame'
import Toast from '../../components/Toast'
import axiosInstance from '../../api/axiosConfig'
import { bulkUploadProducts, fetchProducts } from '../../store/productSlice'

const PREVIEW_ROW_LIMIT = 10
const ACCEPTED_TYPES = '.csv,.xlsx,.xls'

function parseSpreadsheet(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) {
          reject(new Error('The file contains no sheets.'))
          return
        }
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName])
        resolve(rows)
      } catch (err) {
        reject(new Error('Could not read the file. Please use a valid CSV or Excel file.'))
      }
    }
    reader.onerror = () => reject(new Error('Failed to read the selected file.'))
    reader.readAsArrayBuffer(file)
  })
}

function BulkUploadProducts() {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const isApproved = user ? user.isApproved : true

  const [selectedFile, setSelectedFile] = useState(null)
  const [previewRows, setPreviewRows] = useState([])
  const [previewColumns, setPreviewColumns] = useState([])
  const [dragActive, setDragActive] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)
  const [result, setResult] = useState(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Please select a CSV or Excel (.xlsx) file.')
      return
    }

    setError(null)
    setResult(null)
    setSelectedFile(file)
    setParsing(true)

    try {
      const rows = await parseSpreadsheet(file)
      if (rows.length === 0) {
        setPreviewRows([])
        setPreviewColumns([])
        setError('The file contains no data rows.')
        return
      }
      const columns = Object.keys(rows[0])
      setPreviewColumns(columns)
      setPreviewRows(rows.slice(0, PREVIEW_ROW_LIMIT))
    } catch (err) {
      setSelectedFile(null)
      setPreviewRows([])
      setPreviewColumns([])
      setError(err.message)
    } finally {
      setParsing(false)
    }
  }, [])

  const onInputChange = (event) => {
    const file = event.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  const onDrop = (event) => {
    event.preventDefault()
    setDragActive(false)
    const file = event.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    setError(null)
    try {
      const res = await axiosInstance.get('/products/bulk/template', {
        responseType: 'blob',
      })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'bazarix_bulk_upload_template.xlsx')
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      showToast('Template downloaded successfully.', 'info')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to download template.')
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (!isApproved) {
      setError('Your seller account has not been approved yet. You cannot upload products.')
      return
    }

    if (!selectedFile) {
      setError('Please select a CSV or Excel file to upload.')
      return
    }

    const formData = new FormData()
    formData.append('file', selectedFile)

    setUploading(true)
    try {
      const data = await dispatch(bulkUploadProducts(formData)).unwrap()
      setResult(data)
      dispatch(fetchProducts())
      if (data.failedCount === 0) {
        showToast(`Successfully uploaded ${data.successCount} product(s).`)
      } else {
        showToast(
          `Uploaded ${data.successCount} product(s). ${data.failedCount} row(s) need fixes.`,
          data.successCount > 0 ? 'info' : 'error',
        )
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Bulk upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setPreviewRows([])
    setPreviewColumns([])
    setResult(null)
    setError(null)
  }

  return (
    <PageFrame
      title="Bulk Upload Products"
      description="Create many products at once from a spreadsheet. Download the template, fill in your catalog, and upload."
      actions={
        <Link
          to="/seller/products"
          className="rounded-md border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          ← Back to Products
        </Link>
      }
    >
      <div className="grid gap-4 md:grid-cols-[240px_1fr]">
        <Sidebar role="seller" />
        <div className="space-y-4">
          {!isApproved && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
              Your seller account is pending admin approval. You cannot upload products at this time.
            </div>
          )}

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
              <li>Download the template below — it includes the correct column names and example rows.</li>
              <li>
                Fill in one product per row. For images, use the <code className="rounded bg-slate-100 px-1">image_url</code>,{' '}
                <code className="rounded bg-slate-100 px-1">image_url_2</code>, and{' '}
                <code className="rounded bg-slate-100 px-1">image_url_3</code> columns with hosted image URLs.
              </li>
              <li>
                To get image URLs: upload images individually via{' '}
                <Link to="/seller/products/add" className="font-semibold text-blue-600 hover:underline">
                  Add Product
                </Link>{' '}
                or the <code className="rounded bg-slate-100 px-1">POST /api/upload/image</code> endpoint, then paste
                the returned URLs into your spreadsheet. Do not embed images in the file.
              </li>
              <li>Preview the first 10 rows below, then submit. Fix any reported errors and re-upload failed rows.</li>
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Maximum 500 rows per file. Multi-value columns (colorFamilies, seasons, sizes) accept comma- or pipe-separated values.
            </p>

            <button
              type="button"
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="mt-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
            >
              {downloadingTemplate ? 'Downloading…' : 'Download Template (.xlsx)'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Upload spreadsheet</h2>

            <div
              className={`mt-4 flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 transition ${
                dragActive ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50'
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={onDrop}
            >
              <p className="text-sm font-medium text-slate-700">
                Drag and drop your file here, or click to browse
              </p>
              <p className="mt-1 text-xs text-slate-500">Accepted formats: CSV, XLSX (max 500 rows)</p>
              <input
                type="file"
                accept={ACCEPTED_TYPES}
                onChange={onInputChange}
                className="mt-4 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700"
              />
              {selectedFile && (
                <p className="mt-3 text-sm text-slate-600">
                  Selected: <span className="font-semibold">{selectedFile.name}</span>
                  {' '}
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-semibold text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </p>
              )}
            </div>

            {parsing && (
              <p className="mt-3 text-sm text-slate-500">Parsing file for preview…</p>
            )}

            {previewRows.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-800">
                  Preview (first {Math.min(previewRows.length, PREVIEW_ROW_LIMIT)} rows)
                </h3>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        {previewColumns.map((col) => (
                          <th key={col} className="whitespace-nowrap px-3 py-2 font-semibold text-slate-700">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {previewRows.map((row, idx) => (
                        <tr key={idx}>
                          {previewColumns.map((col) => (
                            <td key={col} className="max-w-[200px] truncate whitespace-nowrap px-3 py-2 text-slate-600">
                              {row[col] !== undefined && row[col] !== null ? String(row[col]) : ''}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm font-semibold text-red-500">{error}</p>
            )}

            <button
              type="submit"
              disabled={uploading || parsing || !selectedFile || !isApproved}
              className="mt-6 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload Products'}
            </button>
          </form>

          {result && (
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Upload results</h2>
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="rounded-lg border border-green-200 bg-green-50 px-5 py-3">
                  <p className="text-xs font-medium uppercase text-green-700">Successful</p>
                  <p className="text-2xl font-bold text-green-800">{result.successCount}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-3">
                  <p className="text-xs font-medium uppercase text-red-700">Failed</p>
                  <p className="text-2xl font-bold text-red-800">{result.failedCount}</p>
                </div>
              </div>

              {result.errors?.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-800">Rows that need fixes</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Correct these rows in your spreadsheet and upload again. Valid rows from this batch were already saved.
                  </p>
                  <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 font-semibold text-slate-700">Row</th>
                          <th className="px-4 py-2 font-semibold text-slate-700">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {result.errors.map((err, idx) => (
                          <tr key={idx}>
                            <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-900">{err.row}</td>
                            <td className="px-4 py-2 text-red-600">{err.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result.successCount > 0 && (
                <Link
                  to="/seller/products"
                  className="mt-6 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  View my products
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </PageFrame>
  )
}

export default BulkUploadProducts
