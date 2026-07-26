import { useState } from 'react'

function VariantBuilder({ onCreate }) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('')

  const handleAdd = () => {
    if (!name || !value) return
    onCreate?.({ name, value })
    setName('')
    setValue('')
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-slate-900">Build Product Variant</h4>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Attribute (Color)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value (Black)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
          onClick={handleAdd}
        >
          Add Variant
        </button>
      </div>
    </div>
  )
}

export default VariantBuilder
