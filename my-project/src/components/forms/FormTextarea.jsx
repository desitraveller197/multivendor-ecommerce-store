export default function FormTextarea({ label, name, value, onChange, placeholder='', rows=3, error='', required=false, disabled=false }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <textarea
        id={name} name={name} value={value}
        onChange={onChange} placeholder={placeholder} rows={rows}
        disabled={disabled} required={required}
        className={`w-full rounded border px-3 py-2 text-sm outline-none
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          disabled:bg-slate-50 disabled:text-slate-400
          ${error ? 'border-red-400' : 'border-slate-300'}`}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
