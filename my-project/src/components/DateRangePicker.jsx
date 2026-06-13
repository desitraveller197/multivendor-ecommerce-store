function DateRangePicker({ from, to, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange({ from: e.target.value, to })}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
      <span className="text-sm text-slate-500">to</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange({ from, to: e.target.value })}
        className="rounded-md border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  )
}

export default DateRangePicker
