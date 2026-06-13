export default function FormSelect({ label, name, value, onChange, options=[], error='', required=false, disabled=false }) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-slate-700">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <select
        id={name} name={name} value={value}
        onChange={onChange}
        disabled={disabled} required={required}
        className={`w-full rounded border px-3 py-2 text-sm outline-none
          focus:border-blue-500 focus:ring-1 focus:ring-blue-500
          disabled:bg-slate-50 disabled:text-slate-400
          ${error ? 'border-red-400' : 'border-slate-300'}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
