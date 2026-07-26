function CommissionInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        min="0"
        max="100"
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <span className="text-sm text-slate-500">%</span>
    </div>
  )
}

export default CommissionInput
